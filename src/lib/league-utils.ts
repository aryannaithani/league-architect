import { Match, Player, Standing } from "./league-types";

export function generateFixtures(players: Player[], numLegs: number = 1): Match[] {
  const n = players.length;
  const ids = players.map((p) => p.id);

  const teams = n % 2 === 0 ? [...ids] : [...ids, "BYE"];
  const numTeams = teams.length;
  const roundsPerLeg = numTeams - 1;
  const half = numTeams / 2;

  const matches: Match[] = [];
  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let leg = 0; leg < numLegs; leg++) {
    // Reset rotation for each leg
    const rot = [...teams.slice(1)];
    for (let round = 0; round < roundsPerLeg; round++) {
      const current = [fixed, ...rot];
      const matchdayNum = leg * roundsPerLeg + round + 1;
      for (let i = 0; i < half; i++) {
        let home = current[i];
        let away = current[numTeams - 1 - i];
        if (home === "BYE" || away === "BYE") continue;
        // Swap home/away on odd rounds and reverse for second leg
        if (round % 2 !== 0) [home, away] = [away, home];
        if (leg % 2 !== 0) [home, away] = [away, home];
        matches.push({
          id: `${leg}-${round}-${i}`,
          round: matchdayNum,
          homeId: home,
          awayId: away,
          homeScore: null,
          awayScore: null,
          played: false,
        });
      }
      rot.unshift(rot.pop()!);
    }
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
