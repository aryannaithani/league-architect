import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { LeagueState, Player, Match, KnockoutMatch } from "@/lib/league-types";
import { calculateStandings } from "@/lib/league-utils";
import { getCache, setCache, isCacheStale, clearAllCache, CACHE_KEYS } from "@/lib/cache";

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
  isUpdating: boolean;
  isCacheStale: boolean;
  isInitialLoad: boolean;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used within LeagueProvider");
  return ctx;
};

function mapMatch(m: any): Match {
  return {
    id: m.id, round: m.round, homeId: m.home_id, awayId: m.away_id,
    homeScore: m.home_score, awayScore: m.away_score, played: m.played,
  };
}

function mapKOMatch(m: any): KnockoutMatch {
  return {
    id: m.id, stage: m.stage, matchIndex: m.match_index,
    homeId: m.home_id, awayId: m.away_id,
    homeScore: m.home_score, awayScore: m.away_score, played: m.played,
  };
}

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LeagueState>(() => {
    // Hydrate from cache immediately
    const cachedPlayers = getCache<Player[]>(CACHE_KEYS.players);
    const cachedMatches = getCache<Match[]>(CACHE_KEYS.matches);
    const cachedState = getCache<{ fixtures_generated: boolean; league_complete: boolean }>(CACHE_KEYS.state);
    const cachedKO = getCache<KnockoutMatch[]>(CACHE_KEYS.knockout);

    if (cachedPlayers || cachedMatches || cachedState) {
      return {
        players: cachedPlayers?.data ?? [],
        matches: cachedMatches?.data ?? [],
        knockoutMatches: cachedKO?.data ?? [],
        fixturesGenerated: cachedState?.data?.fixtures_generated ?? false,
        leagueComplete: cachedState?.data?.league_complete ?? false,
        isAdmin: false,
      };
    }
    return defaultState;
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [cacheStale, setCacheStale] = useState(() =>
    isCacheStale(CACHE_KEYS.players) || isCacheStale(CACHE_KEYS.matches)
  );
  const [isInitialLoad, setIsInitialLoad] = useState(() => {
    // If we have cached data, it's not an initial load (we rendered cache)
    return !getCache(CACHE_KEYS.players) && !getCache(CACHE_KEYS.matches);
  });

  useEffect(() => {
    const loadData = async () => {
      setIsUpdating(true);
      try {
        const [playersRes, matchesRes, stateRes, koRes] = await Promise.all([
          fetch(`${API_BASE}/players`),
          fetch(`${API_BASE}/matches`),
          fetch(`${API_BASE}/state`),
          fetch(`${API_BASE}/knockout`),
        ]);
        const players: Player[] = await playersRes.json();
        const matches: Match[] = (await matchesRes.json()).map(mapMatch);
        const leagueState = await stateRes.json();
        const koMatches: KnockoutMatch[] = koRes.ok ? (await koRes.json()).map(mapKOMatch) : [];

        // Update cache
        setCache(CACHE_KEYS.players, players);
        setCache(CACHE_KEYS.matches, matches);
        setCache(CACHE_KEYS.state, { fixtures_generated: leagueState.fixtures_generated, league_complete: leagueState.league_complete || false });
        setCache(CACHE_KEYS.knockout, koMatches);

        setState((s) => ({
          ...s,
          players,
          matches,
          knockoutMatches: koMatches,
          fixturesGenerated: leagueState.fixtures_generated,
          leagueComplete: leagueState.league_complete || false,
        }));
        setCacheStale(false);
      } catch (error) {
        console.error("Failed to load data from backend:", error);
      } finally {
        setIsUpdating(false);
        setIsInitialLoad(false);
      }
    };
    loadData();
  }, []);

  const leagueComplete = useMemo(() => {
    if (!state.fixturesGenerated || state.matches.length === 0) return false;
    return state.matches.every((m) => m.played);
  }, [state.fixturesGenerated, state.matches]);

  const qualifiedPlayerIds = useMemo(() => {
    if (!state.fixturesGenerated) return [];
    const standings = calculateStandings(state.players, state.matches);
    return standings.slice(0, 4).map((s) => s.playerId);
  }, [state.players, state.matches, state.fixturesGenerated]);

  const eliminatedPlayerIds = useMemo(() => {
    if (!leagueComplete) return [];
    return state.players.map((p) => p.id).filter((id) => !qualifiedPlayerIds.includes(id));
  }, [leagueComplete, state.players, qualifiedPlayerIds]);

  const updateCacheAfterMutation = useCallback((partial: Partial<LeagueState>) => {
    if (partial.players !== undefined) setCache(CACHE_KEYS.players, partial.players);
    if (partial.matches !== undefined) setCache(CACHE_KEYS.matches, partial.matches);
    if (partial.knockoutMatches !== undefined) setCache(CACHE_KEYS.knockout, partial.knockoutMatches);
    if (partial.fixturesGenerated !== undefined || partial.leagueComplete !== undefined) {
      setCache(CACHE_KEYS.state, {
        fixtures_generated: partial.fixturesGenerated ?? state.fixturesGenerated,
        league_complete: partial.leagueComplete ?? state.leagueComplete,
      });
    }
  }, [state.fixturesGenerated, state.leagueComplete]);

  const addPlayer = useCallback(async (name: string, avatar: string) => {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      if (!res.ok) throw new Error("Failed to add player");
      const player = await res.json();
      setState((s) => {
        const newPlayers = [...s.players, player];
        setCache(CACHE_KEYS.players, newPlayers);
        return { ...s, players: newPlayers };
      });
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  }, []);

  const removePlayer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/players/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove player");
      setState((s) => {
        const newPlayers = s.players.filter((p) => p.id !== id);
        setCache(CACHE_KEYS.players, newPlayers);
        return { ...s, players: newPlayers };
      });
    } catch (error) {
      console.error("Failed to remove player:", error);
    }
  }, []);

  const generateLeague = useCallback(async (numLegs: number = 1) => {
    try {
      const res = await fetch(`${API_BASE}/matches/generate?num_legs=${numLegs}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate fixtures");
      const matches = (await res.json()).map(mapMatch);
      setState((s) => {
        setCache(CACHE_KEYS.matches, matches);
        setCache(CACHE_KEYS.state, { fixtures_generated: true, league_complete: false });
        return { ...s, matches, fixturesGenerated: true };
      });
    } catch (error) {
      console.error("Failed to generate fixtures:", error);
    }
  }, []);

  const updateMatchResult = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_score: homeScore, away_score: awayScore }),
      });
      if (!res.ok) throw new Error("Failed to update match result");
      const updatedMatch = mapMatch(await res.json());
      setState((s) => {
        const newMatches = s.matches.map((m) => (m.id === matchId ? updatedMatch : m));
        setCache(CACHE_KEYS.matches, newMatches);
        return { ...s, matches: newMatches };
      });

      setState((s) => {
        const allPlayed = s.matches.every((m) => m.played);
        if (allPlayed && s.knockoutMatches.length === 0) {
          fetch(`${API_BASE}/knockout/generate`, { method: "POST" })
            .then((r) => r.json())
            .then((koRaw) => {
              const koMatches = koRaw.map(mapKOMatch);
              setCache(CACHE_KEYS.knockout, koMatches);
              setCache(CACHE_KEYS.state, { fixtures_generated: true, league_complete: true });
              setState((prev) => ({ ...prev, knockoutMatches: koMatches, leagueComplete: true }));
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
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_score: homeScore, away_score: awayScore }),
      });
      if (!res.ok) throw new Error("Failed to update KO result");
      const koRes = await fetch(`${API_BASE}/knockout`);
      const koMatches = (await koRes.json()).map(mapKOMatch);
      setCache(CACHE_KEYS.knockout, koMatches);
      setState((s) => ({ ...s, knockoutMatches: koMatches }));
    } catch (error) {
      console.error("Failed to update KO result:", error);
    }
  }, []);

  const resetLeague = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/league/reset`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset league");
      clearAllCache();
      setState((s) => ({ ...defaultState, isAdmin: s.isAdmin }));
    } catch (error) {
      console.error("Failed to reset league:", error);
    }
  }, []);

  const loginAdmin = useCallback(async (password: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { setState((s) => ({ ...s, isAdmin: true })); return true; }
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
        addPlayer, removePlayer, generateLeague,
        updateMatchResult, updateKnockoutResult,
        resetLeague, loginAdmin, logoutAdmin,
        qualifiedPlayerIds, eliminatedPlayerIds,
        isUpdating,
        isCacheStale: cacheStale,
        isInitialLoad,
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
};
