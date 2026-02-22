import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LeagueState, Player, Match } from "@/lib/league-types";
import { generateFixtures } from "@/lib/league-utils";

const API_BASE = "http://localhost:8000";

const defaultState: LeagueState = {
  players: [],
  matches: [],
  fixturesGenerated: false,
  isAdmin: false,
};

interface LeagueContextType extends LeagueState {
  addPlayer: (name: string, avatar: string) => void;
  removePlayer: (id: string) => void;
  generateLeague: () => void;
  updateMatchResult: (matchId: string, homeScore: number, awayScore: number) => void;
  resetLeague: () => void;
  loginAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used within LeagueProvider");
  return ctx;
};

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LeagueState>(defaultState);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [playersRes, matchesRes, stateRes] = await Promise.all([
          fetch(`${API_BASE}/players`),
          fetch(`${API_BASE}/matches`),
          fetch(`${API_BASE}/state`),
        ]);
        const players = await playersRes.json();
        const matchesRaw = await matchesRes.json();
        const matches = matchesRaw.map((m: any) => ({
          id: m.id,
          round: m.round,
          homeId: m.home_id,
          awayId: m.away_id,
          homeScore: m.home_score,
          awayScore: m.away_score,
          played: m.played,
        }));
        const leagueState = await stateRes.json();
        setState((s) => ({
          ...s,
          players,
          matches,
          fixturesGenerated: leagueState.fixtures_generated,
        }));
      } catch (error) {
        console.error("Failed to load data from backend:", error);
      }
    };
    loadData();
  }, []);

  const addPlayer = useCallback(async (name: string, avatar: string) => {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      if (!res.ok) throw new Error("Failed to add player");
      const player = await res.json();
      setState((s) => ({
        ...s,
        players: [...s.players, player],
      }));
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  }, []);

  const removePlayer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/players/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove player");
      setState((s) => ({
        ...s,
        players: s.players.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error("Failed to remove player:", error);
    }
  }, []);

  const generateLeague = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/matches/generate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate fixtures");
      const matchesRaw = await res.json();
      const matches = matchesRaw.map((m: any) => ({
        id: m.id,
        round: m.round,
        homeId: m.home_id,
        awayId: m.away_id,
        homeScore: m.home_score,
        awayScore: m.away_score,
        played: m.played,
      }));
      setState((s) => ({
        ...s,
        matches,
        fixturesGenerated: true,
      }));
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
      const updatedMatchRaw = await res.json();
      const updatedMatch = {
        id: updatedMatchRaw.id,
        round: updatedMatchRaw.round,
        homeId: updatedMatchRaw.home_id,
        awayId: updatedMatchRaw.away_id,
        homeScore: updatedMatchRaw.home_score,
        awayScore: updatedMatchRaw.away_score,
        played: updatedMatchRaw.played,
      };
      setState((s) => ({
        ...s,
        matches: s.matches.map((m) =>
          m.id === matchId ? updatedMatch : m
        ),
      }));
    } catch (error) {
      console.error("Failed to update match result:", error);
    }
  }, []);

  const resetLeague = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/league/reset`, {
        method: "DELETE",
      });
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
      value={{ ...state, addPlayer, removePlayer, generateLeague, updateMatchResult, resetLeague, loginAdmin, logoutAdmin }}
    >
      {children}
    </LeagueContext.Provider>
  );
};
