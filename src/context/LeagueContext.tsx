import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LeagueState, Player, Match } from "@/lib/league-types";
import { generateFixtures } from "@/lib/league-utils";

const STORAGE_KEY = "efootball-league";
const ADMIN_KEY = "efootball-admin";

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
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
}

const LeagueContext = createContext<LeagueContextType | null>(null);

export const useLeague = () => {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used within LeagueProvider");
  return ctx;
};

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LeagueState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const isAdmin = localStorage.getItem(ADMIN_KEY) === "true";
    if (saved) {
      return { ...JSON.parse(saved), isAdmin };
    }
    return { ...defaultState, isAdmin };
  });

  useEffect(() => {
    const { isAdmin, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  const addPlayer = useCallback((name: string, avatar: string) => {
    setState((s) => ({
      ...s,
      players: [...s.players, { id: crypto.randomUUID(), name, avatar }],
    }));
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== id),
    }));
  }, []);

  const generateLeague = useCallback(() => {
    setState((s) => ({
      ...s,
      matches: generateFixtures(s.players),
      fixturesGenerated: true,
    }));
  }, []);

  const updateMatchResult = useCallback((matchId: string, homeScore: number, awayScore: number) => {
    setState((s) => ({
      ...s,
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, homeScore, awayScore, played: true } : m
      ),
    }));
  }, []);

  const resetLeague = useCallback(() => {
    setState((s) => ({ ...defaultState, isAdmin: s.isAdmin }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loginAdmin = useCallback((password: string) => {
    // Simple hardcoded password — user can change this
    if (password === "admin123") {
      localStorage.setItem(ADMIN_KEY, "true");
      setState((s) => ({ ...s, isAdmin: true }));
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
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
