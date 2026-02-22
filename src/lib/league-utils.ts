import { Match, Player, Standing } from "./league-types";

export function generateFixtures(players: Player[]): Match[] {
  const n = players.length;
  const ids = players.map((p) => p.id);

  // If odd number of players, add a "bye" placeholder
  const teams = n % 2 === 0 ? [...ids] : [...ids, "BYE"];
  const numTeams = teams.length;
  const rounds = numTeams - 1;
  const half = numTeams / 2;

  const matches: Match[] = [];
  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let round = 0; round < rounds; round++) {
    const current = [fixed, ...rotating];
    for (let i = 0; i < half; i++) {
      const home = current[i];
      const away = current[numTeams - 1 - i];
      if (home === "BYE" || away === "BYE") continue;
      matches.push({
        id: `${round}-${i}`,
        round: round + 1,
        homeId: round % 2 === 0 ? home : away,
        awayId: round % 2 === 0 ? away : home,
        homeScore: null,
        awayScore: null,
        played: false,
      });
    }
    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!);
  }

  return matches;
}

export function calculateStandings(players: Player[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();

  players.forEach((p) => {
    map.set(p.id, {
      playerId: p.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  });

  matches
    .filter((m) => m.played)
    .forEach((m) => {
      const home = map.get(m.homeId)!;
      const away = map.get(m.awayId)!;
      const hs = m.homeScore!;
      const as = m.awayScore!;

      home.played++;
      away.played++;
      home.goalsFor += hs;
      home.goalsAgainst += as;
      away.goalsFor += as;
      away.goalsAgainst += hs;

      if (hs > as) {
        home.won++;
        away.lost++;
        home.points += 3;
      } else if (hs < as) {
        away.won++;
        home.lost++;
        away.points += 3;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

  return Array.from(map.values()).sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );
}

export function getLeagueStats(players: Player[], matches: Match[]) {
  const played = matches.filter((m) => m.played);
  const totalGoals = played.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const avgGoals = played.length > 0 ? (totalGoals / played.length).toFixed(1) : "0";

  // Top scorer (most goals for)
  const standings = calculateStandings(players, matches);
  const topScorer = standings.length > 0 ? standings.reduce((a, b) => (a.goalsFor > b.goalsFor ? a : b)) : null;

  // Biggest win
  let biggestWin: Match | null = null;
  let biggestDiff = 0;
  played.forEach((m) => {
    const diff = Math.abs((m.homeScore ?? 0) - (m.awayScore ?? 0));
    if (diff > biggestDiff) {
      biggestDiff = diff;
      biggestWin = m;
    }
  });

  // Highest scoring match
  let highestScoring: Match | null = null;
  let highestTotal = 0;
  played.forEach((m) => {
    const total = (m.homeScore ?? 0) + (m.awayScore ?? 0);
    if (total > highestTotal) {
      highestTotal = total;
      highestScoring = m;
    }
  });

  return {
    totalMatches: matches.length,
    matchesPlayed: played.length,
    totalGoals,
    avgGoals,
    topScorer,
    biggestWin,
    biggestDiff,
    highestScoring,
    highestTotal,
  };
}
