import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { LeagueState, Player, Match, KnockoutMatch } from "@/lib/league-types";
import { calculateStandings } from "@/lib/league-utils";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const defaultState: LeagueState = {
  players: [],
  matches: [],
  knockoutMatches: [],
  fixturesGenerated: false,
  leagueComplete: false,
  isAdmin: false,
};

interface LeagueContextType extends LeagueState {
  addPlayer: (name: string, avatar: string) => void;
  removePlayer: (id: string) => void;
  generateLeague: (numLegs?: number) => void;
  updateMatchResult: (matchId: string, homeScore: number, awayScore: number) => void;
  updateKnockoutResult: (matchId: string, homeScore: number, awayScore: number) => void;
  resetLeague: () => void;
  loginAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  qualifiedPlayerIds: string[];
  eliminatedPlayerIds: string[];
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used within LeagueProvider");
  return ctx;
};

function mapMatch(m: any): Match {
  return {
    id: m.id,
    round: m.round,
    homeId: m.home_id,
    awayId: m.away_id,
    homeScore: m.home_score,
    awayScore: m.away_score,
    played: m.played,
  };
}

function mapKOMatch(m: any): KnockoutMatch {
  return {
    id: m.id,
    stage: m.stage,
    matchIndex: m.match_index,
    homeId: m.home_id,
    awayId: m.away_id,
    homeScore: m.home_score,
    awayScore: m.away_score,
    played: m.played,
  };
}

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LeagueState>(defaultState);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [playersRes, matchesRes, stateRes, koRes] = await Promise.all([
          fetch(`${API_BASE}/players`),
          fetch(`${API_BASE}/matches`),
          fetch(`${API_BASE}/state`),
          fetch(`${API_BASE}/knockout`),
        ]);
        const players = await playersRes.json();
        const matches = (await matchesRes.json()).map(mapMatch);
        const leagueState = await stateRes.json();
        const koMatches = koRes.ok ? (await koRes.json()).map(mapKOMatch) : [];
        setState((s) => ({
          ...s,
          players,
          matches,
          knockoutMatches: koMatches,
          fixturesGenerated: leagueState.fixtures_generated,
          leagueComplete: leagueState.league_complete || false,
        }));
      } catch (error) {
        console.error("Failed to load data from backend:", error);
      }
    };
    loadData();
  }, []);

  // Derived: check if league is complete (all matches played)
  const leagueComplete = useMemo(() => {
    if (!state.fixturesGenerated || state.matches.length === 0) return false;
    return state.matches.every((m) => m.played);
  }, [state.fixturesGenerated, state.matches]);

  // Derived: top 4 qualified player IDs
  const qualifiedPlayerIds = useMemo(() => {
    if (!state.fixturesGenerated) return [];
    const standings = calculateStandings(state.players, state.matches);
    return standings.slice(0, 4).map((s) => s.playerId);
  }, [state.players, state.matches, state.fixturesGenerated]);

  // Derived: eliminated player IDs (not in top 4 after league is complete)
  const eliminatedPlayerIds = useMemo(() => {
    if (!leagueComplete) return [];
    return state.players.map((p) => p.id).filter((id) => !qualifiedPlayerIds.includes(id));
  }, [leagueComplete, state.players, qualifiedPlayerIds]);

  const addPlayer = useCallback(async (name: string, avatar: string) => {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      if (!res.ok) throw new Error("Failed to add player");
      const player = await res.json();
      setState((s) => ({ ...s, players: [...s.players, player] }));
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  }, []);

  const removePlayer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/players/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove player");
      setState((s) => ({ ...s, players: s.players.filter((p) => p.id !== id) }));
    } catch (error) {
      console.error("Failed to remove player:", error);
    }
  }, []);

  const generateLeague = useCallback(async (numLegs: number = 1) => {
    try {
      const res = await fetch(`${API_BASE}/matches/generate?num_legs=${numLegs}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate fixtures");
      const matches = (await res.json()).map(mapMatch);
      setState((s) => ({ ...s, matches, fixturesGenerated: true }));
    } catch (error) {
      console.error("Failed to generate fixtures:", error);
    }
  }, []);

  const updateMatchResult = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_score: homeScore, away_score: awayScore }),
      });
      if (!res.ok) throw new Error("Failed to update match result");
      const updatedMatch = mapMatch(await res.json());
      setState((s) => {
        const newMatches = s.matches.map((m) => (m.id === matchId ? updatedMatch : m));
        return { ...s, matches: newMatches };
      });

      // Check if league is now complete and generate KO if needed
      setState((s) => {
        const allPlayed = s.matches.every((m) => m.played);
        if (allPlayed && s.knockoutMatches.length === 0) {
          // Trigger KO generation
          fetch(`${API_BASE}/knockout/generate`, { method: "POST" })
            .then((r) => r.json())
            .then((koRaw) => {
              setState((prev) => ({
                ...prev,
                knockoutMatches: koRaw.map(mapKOMatch),
                leagueComplete: true,
              }));
            })
            .catch(console.error);
        }
        return s;
      });
    } catch (error) {
      console.error("Failed to update match result:", error);
    }
  }, []);

  const updateKnockoutResult = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const res = await fetch(`${API_BASE}/knockout/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_score: homeScore, away_score: awayScore }),
      });
      if (!res.ok) throw new Error("Failed to update KO result");
      // Refetch all KO matches to get updated bracket (final might have new players)
      const koRes = await fetch(`${API_BASE}/knockout`);
      const koMatches = (await koRes.json()).map(mapKOMatch);
      setState((s) => ({ ...s, knockoutMatches: koMatches }));
    } catch (error) {
      console.error("Failed to update KO result:", error);
    }
  }, []);

  const resetLeague = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/league/reset`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset league");
      setState((s) => ({ ...defaultState, isAdmin: s.isAdmin }));
    } catch (error) {
      console.error("Failed to reset league:", error);
    }
  }, []);

  const loginAdmin = useCallback(async (password: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setState((s) => ({ ...s, isAdmin: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to login admin:", error);
      return false;
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setState((s) => ({ ...s, isAdmin: false }));
  }, []);

  return (
    <LeagueContext.Provider
      value={{
        ...state,
        leagueComplete,
        addPlayer,
        removePlayer,
        generateLeague,
        updateMatchResult,
        updateKnockoutResult,
        resetLeague,
        loginAdmin,
        logoutAdmin,
        qualifiedPlayerIds,
        eliminatedPlayerIds,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
};
