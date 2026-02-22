import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { getLeagueStats } from "@/lib/league-utils";
import { Target, Swords, TrendingUp, BarChart3 } from "lucide-react";

const Stats: React.FC = () => {
  const { players, matches, fixturesGenerated } = useLeague();

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-display text-lg">No stats yet.</p>
      </div>
    );
  }

  const stats = getLeagueStats(players, matches);
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const statCards = [
    {
      icon: BarChart3,
      label: "Matches Played",
      value: `${stats.matchesPlayed} / ${stats.totalMatches}`,
    },
    {
      icon: Target,
      label: "Total Goals",
      value: stats.totalGoals,
    },
    {
      icon: TrendingUp,
      label: "Avg Goals / Match",
      value: stats.avgGoals,
    },
    {
      icon: Swords,
      label: "Top Scorer",
      value: stats.topScorer ? `${getPlayer(stats.topScorer.playerId)?.name} (${stats.topScorer.goalsFor})` : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold tracking-wide text-primary">LEAGUE STATS</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 card-hover">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <s.icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="font-display text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {stats.biggestWin && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Biggest Win</p>
          <p className="font-display font-bold">
            {getPlayer(stats.biggestWin.homeId)?.name} {stats.biggestWin.homeScore} - {stats.biggestWin.awayScore}{" "}
            {getPlayer(stats.biggestWin.awayId)?.name}
          </p>
        </div>
      )}

      {stats.highestScoring && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Highest Scoring Match</p>
          <p className="font-display font-bold">
            {getPlayer(stats.highestScoring.homeId)?.name} {stats.highestScoring.homeScore} -{" "}
            {stats.highestScoring.awayScore} {getPlayer(stats.highestScoring.awayId)?.name} ({stats.highestTotal} goals)
          </p>
        </div>
      )}
    </div>
  );
};

export default Stats;
