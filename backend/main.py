from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from typing import Optional
import os
import uuid
import math
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="eFootball League API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
# ---------------------------------------------------------------------------
# MongoDB connection  –  set MONGO_URI in your environment
# ---------------------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

client = MongoClient(MONGO_URI)
db = client["efootball_league"]

players_col   = db["players"]
matches_col   = db["matches"]
knockout_col  = db["knockout"]
state_col     = db["state"]          # single doc: { fixtures_generated: bool, league_complete: bool }

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class PlayerIn(BaseModel):
    name: str
    avatar: str = ""                 # base64 data URL

class MatchResultIn(BaseModel):
    home_score: int
    away_score: int

class AdminLoginIn(BaseModel):
    password: str

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_state() -> dict:
    s = state_col.find_one({})
    if not s:
        state_col.insert_one({"fixtures_generated": False, "league_complete": False})
        return {"fixtures_generated": False, "league_complete": False}
    return s

def _serialize(doc: dict) -> dict:
    """Remove MongoDB _id and return clean dict."""
    doc.pop("_id", None)
    return doc

def _generate_fixtures(player_ids: list[str], num_legs: int = 1) -> list[dict]:
    """Round-robin fixture generation with multi-leg support."""
    teams = player_ids[:] if len(player_ids) % 2 == 0 else player_ids + ["BYE"]
    n = len(teams)
    rounds_per_leg = n - 1
    half = n // 2

    fixed = teams[0]
    matches = []

    for leg in range(num_legs):
        rotating = teams[1:]
        for rnd in range(rounds_per_leg):
            current = [fixed] + rotating
            matchday = leg * rounds_per_leg + rnd + 1
            for i in range(half):
                home = current[i]
                away = current[n - 1 - i]
                if home == "BYE" or away == "BYE":
                    continue
                if rnd % 2 != 0:
                    home, away = away, home
                if leg % 2 != 0:
                    home, away = away, home
                matches.append({
                    "id": str(uuid.uuid4()),
                    "round": matchday,
                    "home_id": home,
                    "away_id": away,
                    "home_score": None,
                    "away_score": None,
                    "played": False,
                })
            rotating = [rotating[-1]] + rotating[:-1]

    return matches

def _compute_standings() -> list[dict]:
    """Compute league standings from matches only (not KO)."""
    players = {p["id"]: p["name"] for p in players_col.find()}
    stats: dict[str, dict] = {
        pid: {
            "player_id": pid,
            "name": name,
            "played": 0, "won": 0, "drawn": 0, "lost": 0,
            "goals_for": 0, "goals_against": 0, "goal_difference": 0, "points": 0,
        }
        for pid, name in players.items()
    }

    for m in matches_col.find({"played": True}):
        h, a = m["home_id"], m["away_id"]
        hs, as_ = m["home_score"], m["away_score"]
        if h not in stats or a not in stats:
            continue
        stats[h]["played"] += 1;  stats[a]["played"] += 1
        stats[h]["goals_for"] += hs;  stats[h]["goals_against"] += as_
        stats[a]["goals_for"] += as_;  stats[a]["goals_against"] += hs
        if hs > as_:
            stats[h]["won"] += 1;  stats[a]["lost"] += 1;  stats[h]["points"] += 3
        elif hs < as_:
            stats[a]["won"] += 1;  stats[h]["lost"] += 1;  stats[a]["points"] += 3
        else:
            stats[h]["drawn"] += 1;  stats[a]["drawn"] += 1
            stats[h]["points"] += 1;  stats[a]["points"] += 1
        stats[h]["goal_difference"] = stats[h]["goals_for"] - stats[h]["goals_against"]
        stats[a]["goal_difference"] = stats[a]["goals_for"] - stats[a]["goals_against"]

    return sorted(
        stats.values(),
        key=lambda x: (-x["points"], -x["goal_difference"], -x["goals_for"]),
    )

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}

# ---------------------------------------------------------------------------
# Players
# ---------------------------------------------------------------------------
@app.get("/players")
def get_players():
    return [_serialize(p) for p in players_col.find()]


@app.post("/players", status_code=201)
def add_player(body: PlayerIn):
    state = _get_state()
    if state["fixtures_generated"]:
        raise HTTPException(400, "Cannot add players after fixtures are generated.")
    player = {"id": str(uuid.uuid4()), "name": body.name.strip(), "avatar": body.avatar}
    players_col.insert_one(player)
    return _serialize(player)


@app.delete("/players/{player_id}", status_code=204)
def remove_player(player_id: str):
    state = _get_state()
    if state["fixtures_generated"]:
        raise HTTPException(400, "Cannot remove players after fixtures are generated.")
    result = players_col.delete_one({"id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Player not found.")


# ---------------------------------------------------------------------------
# Fixtures / Matches
# ---------------------------------------------------------------------------
@app.get("/matches")
def get_matches():
    return [_serialize(m) for m in matches_col.find()]


@app.post("/matches/generate", status_code=201)
def generate_fixtures(num_legs: int = 1):
    state = _get_state()
    if state["fixtures_generated"]:
        raise HTTPException(400, "Fixtures already generated.")

    player_ids = [p["id"] for p in players_col.find()]
    if len(player_ids) < 2:
        raise HTTPException(400, "Need at least 2 players to generate fixtures.")

    num_legs = max(1, min(4, num_legs))
    fixtures = _generate_fixtures(player_ids, num_legs)
    if fixtures:
        matches_col.insert_many(fixtures)
    state_col.update_one({}, {"$set": {"fixtures_generated": True}}, upsert=True)
    return [_serialize(f) for f in fixtures]


@app.put("/matches/{match_id}")
def update_match_result(match_id: str, body: MatchResultIn):
    if body.home_score < 0 or body.away_score < 0:
        raise HTTPException(400, "Scores must be non-negative.")
    result = matches_col.update_one(
        {"id": match_id},
        {"$set": {
            "home_score": body.home_score,
            "away_score": body.away_score,
            "played": True,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Match not found.")
    match = matches_col.find_one({"id": match_id})
    return _serialize(match)


# ---------------------------------------------------------------------------
# Knockout
# ---------------------------------------------------------------------------
@app.get("/knockout")
def get_knockout():
    return [_serialize(m) for m in knockout_col.find()]


@app.post("/knockout/generate", status_code=201)
def generate_knockout():
    """Generate KO bracket from top 4 in standings. SF: 1v4, 2v3."""
    # Check all league matches are played
    all_matches = list(matches_col.find())
    if not all_matches:
        raise HTTPException(400, "No league matches found.")
    unplayed = [m for m in all_matches if not m["played"]]
    if unplayed:
        raise HTTPException(400, f"{len(unplayed)} league matches still unplayed.")

    # Don't regenerate if already exists
    existing = list(knockout_col.find())
    if existing:
        return [_serialize(m) for m in existing]

    standings = _compute_standings()
    if len(standings) < 4:
        raise HTTPException(400, "Need at least 4 players for knockout.")

    top4 = [s["player_id"] for s in standings[:4]]

    ko_matches = [
        {
            "id": str(uuid.uuid4()),
            "stage": "semi",
            "match_index": 0,
            "home_id": top4[0],  # 1st
            "away_id": top4[3],  # 4th
            "home_score": None,
            "away_score": None,
            "played": False,
        },
        {
            "id": str(uuid.uuid4()),
            "stage": "semi",
            "match_index": 1,
            "home_id": top4[1],  # 2nd
            "away_id": top4[2],  # 3rd
            "home_score": None,
            "away_score": None,
            "played": False,
        },
        {
            "id": str(uuid.uuid4()),
            "stage": "final",
            "match_index": 0,
            "home_id": None,
            "away_id": None,
            "home_score": None,
            "away_score": None,
            "played": False,
        },
    ]
    knockout_col.insert_many(ko_matches)
    state_col.update_one({}, {"$set": {"league_complete": True}}, upsert=True)
    return [_serialize(m) for m in ko_matches]


@app.put("/knockout/{match_id}")
def update_knockout_result(match_id: str, body: MatchResultIn):
    if body.home_score < 0 or body.away_score < 0:
        raise HTTPException(400, "Scores must be non-negative.")
    if body.home_score == body.away_score:
        raise HTTPException(400, "Knockout matches cannot end in a draw.")

    result = knockout_col.update_one(
        {"id": match_id},
        {"$set": {
            "home_score": body.home_score,
            "away_score": body.away_score,
            "played": True,
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Knockout match not found.")

    match = knockout_col.find_one({"id": match_id})

    # If this was a semi, update the final with the winner
    if match["stage"] == "semi":
        winner_id = match["home_id"] if match["home_score"] > match["away_score"] else match["away_id"]
        final = knockout_col.find_one({"stage": "final"})
        if final:
            if match["match_index"] == 0:
                knockout_col.update_one({"id": final["id"]}, {"$set": {"home_id": winner_id}})
            else:
                knockout_col.update_one({"id": final["id"]}, {"$set": {"away_id": winner_id}})

    return [_serialize(m) for m in knockout_col.find()]


# ---------------------------------------------------------------------------
# League state
# ---------------------------------------------------------------------------
@app.get("/state")
def get_league_state():
    s = _get_state()
    return {
        "fixtures_generated": s.get("fixtures_generated", False),
        "league_complete": s.get("league_complete", False),
    }


@app.delete("/league/reset", status_code=204)
def reset_league():
    players_col.delete_many({})
    matches_col.delete_many({})
    knockout_col.delete_many({})
    state_col.update_one({}, {"$set": {"fixtures_generated": False, "league_complete": False}}, upsert=True)


# ---------------------------------------------------------------------------
# Admin login (stateless – just validates the password)
# ---------------------------------------------------------------------------
@app.post("/admin/login")
def admin_login(body: AdminLoginIn):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Invalid password.")
    return {"success": True}


# ---------------------------------------------------------------------------
# Standings & Stats  (computed on the fly so the DB stays simple)
# ---------------------------------------------------------------------------
@app.get("/standings")
def get_standings():
    return _compute_standings()


@app.get("/stats")
def get_stats():
    """Cumulative stats: league + knockout matches."""
    league_matches = list(matches_col.find())
    ko_matches = list(knockout_col.find())
    all_matches = league_matches + ko_matches

    played = [m for m in all_matches if m.get("played")]

    total_goals = sum((m.get("home_score") or 0) + (m.get("away_score") or 0) for m in played)
    avg_goals = round(total_goals / len(played), 1) if played else 0

    biggest_win = None
    biggest_diff = 0
    highest_scoring = None
    highest_total = 0

    for m in played:
        diff = abs((m.get("home_score") or 0) - (m.get("away_score") or 0))
        total = (m.get("home_score") or 0) + (m.get("away_score") or 0)
        if diff > biggest_diff:
            biggest_diff = diff;  biggest_win = _serialize(dict(m))
        if total > highest_total:
            highest_total = total;  highest_scoring = _serialize(dict(m))

    standings = _compute_standings()
    top_scorer = max(standings, key=lambda x: x["goals_for"]) if standings else None

    return {
        "total_matches": len(all_matches),
        "matches_played": len(played),
        "total_goals": total_goals,
        "avg_goals": avg_goals,
        "top_scorer": top_scorer,
        "biggest_win": biggest_win,
        "highest_scoring": highest_scoring,
        "highest_total": highest_total,
    }
