import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { calculateStandings } from "@/lib/league-utils";

const Standings: React.FC = () => {
  const { players, matches, fixturesGenerated } = useLeague();

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-display text-lg">No standings yet.</p>
      </div>
    );
  }

  const standings = calculateStandings(players, matches);
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold tracking-wide text-primary">STANDINGS</h2>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left p-3 w-8">#</th>
              <th className="text-left p-3">Player</th>
              <th className="text-center p-3">P</th>
              <th className="text-center p-3">W</th>
              <th className="text-center p-3">D</th>
              <th className="text-center p-3">L</th>
              <th className="text-center p-3">GF</th>
              <th className="text-center p-3">GA</th>
              <th className="text-center p-3">GD</th>
              <th className="text-center p-3 font-bold">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const player = getPlayer(s.playerId);
              return (
                <tr
                  key={s.playerId}
                  className={`border-t border-border transition-colors hover:bg-secondary/50 ${
                    i === 0 ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3">
                    <span className={`font-display font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                        {player?.avatar ? (
                          <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-display text-primary">{player?.name[0]}</span>
                        )}
                      </div>
                      <span className="font-medium">{player?.name}</span>
                    </div>
                  </td>
                  <td className="text-center p-3">{s.played}</td>
                  <td className="text-center p-3 text-result-win">{s.won}</td>
                  <td className="text-center p-3 text-result-draw">{s.drawn}</td>
                  <td className="text-center p-3 text-result-loss">{s.lost}</td>
                  <td className="text-center p-3">{s.goalsFor}</td>
                  <td className="text-center p-3">{s.goalsAgainst}</td>
                  <td className="text-center p-3">
                    <span className={s.goalDifference > 0 ? "text-result-win" : s.goalDifference < 0 ? "text-result-loss" : ""}>
                      {s.goalDifference > 0 ? "+" : ""}{s.goalDifference}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <span className="font-display font-bold text-primary text-base">{s.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
