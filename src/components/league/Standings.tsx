import React, { useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { calculateStandings } from "@/lib/league-utils";
import { Match } from "@/lib/league-types";
import { Trophy, TrendingUp } from "lucide-react";

const Standings: React.FC = () => {
  const { players, matches, fixturesGenerated } = useLeague();

  // Get form (last 5 matches) for a player
  const getPlayerForm = (playerId: string, matches: Match[]): ("W" | "D" | "L")[] => {
    const playerMatches = matches
      .filter((m) => m.played && (m.homeId === playerId || m.awayId === playerId))
      .sort((a, b) => b.round - a.round)
      .slice(0, 5);

    return playerMatches.map((m) => {
      const isHome = m.homeId === playerId;
      const playerScore = isHome ? m.homeScore! : m.awayScore!;
      const opponentScore = isHome ? m.awayScore! : m.homeScore!;

      if (playerScore > opponentScore) return "W";
      if (playerScore < opponentScore) return "L";
      return "D";
    });
  };

  const standings = useMemo(() => calculateStandings(players, matches), [players, matches]);
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-16 text-muted-foreground fade-in">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-primary/30" />
        <p className="font-display text-xl font-semibold mb-2">No Standings Yet</p>
        <p className="text-sm">Generate fixtures to see the league table</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          League Table
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">Live</span>
        </div>
      </div>

      <div className="glass-strong rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left px-4 md:px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky left-0 bg-white/5 z-10">
                  #
                </th>
                <th className="text-left px-4 md:px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky left-12 md:left-16 bg-white/5 z-10 min-w-[180px]">
                  Player
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  P
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  W
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  D
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  L
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GF
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GA
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GD
                </th>
                <th className="text-center px-3 md:px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Form
                </th>
                <th className="text-center px-4 md:px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  PTS
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const player = getPlayer(s.playerId);
                const form = getPlayerForm(s.playerId, matches);
                const isTopThree = i < 3;
                const isChampion = i === 0;

                return (
                  <tr
                    key={s.playerId}
                    className={`border-b border-white/5 transition-all duration-200 hover:bg-white/5 ${
                      isChampion ? "champion-glow bg-primary/10" : isTopThree ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 md:px-6 py-4 sticky left-0 bg-inherit z-10">
                      <span
                        className={`font-display font-bold text-lg ${
                          isChampion
                            ? "text-primary neon-highlight"
                            : isTopThree
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 sticky left-12 md:left-16 bg-inherit z-10 min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 ${
                            isChampion
                              ? "border-primary champion-glow"
                              : isTopThree
                              ? "border-primary/50"
                              : "border-white/10"
                          }`}
                        >
                          {player?.avatar ? (
                            <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-display font-bold text-primary">
                              {player?.name[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className={`font-semibold truncate ${isChampion ? "text-primary" : "text-foreground"}`}>
                          {player?.name}
                        </span>
                        {isChampion && (
                          <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="text-center px-3 md:px-4 py-4 text-sm font-medium">{s.played}</td>
                    <td className="text-center px-3 md:px-4 py-4 text-sm font-semibold text-result-win">
                      {s.won}
                    </td>
                    <td className="text-center px-3 md:px-4 py-4 text-sm font-semibold text-result-draw">
                      {s.drawn}
                    </td>
                    <td className="text-center px-3 md:px-4 py-4 text-sm font-semibold text-result-loss">
                      {s.lost}
                    </td>
                    <td className="text-center px-3 md:px-4 py-4 text-sm font-medium">{s.goalsFor}</td>
                    <td className="text-center px-3 md:px-4 py-4 text-sm font-medium">{s.goalsAgainst}</td>
                    <td className="text-center px-3 md:px-4 py-4">
                      <span
                        className={`text-sm font-semibold ${
                          s.goalDifference > 0
                            ? "text-result-win"
                            : s.goalDifference < 0
                            ? "text-result-loss"
                            : "text-muted-foreground"
                        }`}
                      >
                        {s.goalDifference > 0 ? "+" : ""}
                        {s.goalDifference}
                      </span>
                    </td>
                    <td className="text-center px-3 md:px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {form.length > 0 ? (
                          form.map((result, idx) => (
                            <span
                              key={idx}
                              className={`form-badge ${
                                result === "W"
                                  ? "form-win"
                                  : result === "D"
                                  ? "form-draw"
                                  : "form-loss"
                              }`}
                            >
                              {result}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center px-4 md:px-6 py-4">
                      <span
                        className={`font-display font-bold text-xl ${
                          isChampion ? "text-primary neon-highlight" : "text-foreground"
                        }`}
                      >
                        {s.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Standings;
