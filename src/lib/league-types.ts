export interface Player {
  id: string;
  name: string;
  avatar: string; // base64 data URL
}

export interface Match {
  id: string;
  round: number;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
}

export interface Standing {
  playerId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueState {
  players: Player[];
  matches: Match[];
  fixturesGenerated: boolean;
  isAdmin: boolean;
}
