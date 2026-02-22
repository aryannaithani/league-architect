import React, { useEffect, useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { getLeagueStats } from "@/lib/league-utils";
import { Target, TrendingUp, BarChart3, Trophy, Zap, Award } from "lucide-react";

// Animated counter component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = 0;
    const endValue = value;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const current = Math.floor(startValue + (endValue - startValue) * progress);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Stats: React.FC = () => {
  const { players, matches, fixturesGenerated } = useLeague();

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-16 text-muted-foreground fade-in">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary/30" />
        <p className="font-display text-xl font-semibold mb-2">No Stats Yet</p>
        <p className="text-sm">Play some matches to see statistics</p>
      </div>
    );
  }

  const stats = getLeagueStats(players, matches);
  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const progressPercentage = stats.totalMatches > 0 ? (stats.matchesPlayed / stats.totalMatches) * 100 : 0;

  const statCards = [
    {
      icon: BarChart3,
      label: "Matches Played",
      value: `${stats.matchesPlayed} / ${stats.totalMatches}`,
      numeric: stats.matchesPlayed,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      label: "Total Goals",
      value: stats.totalGoals,
      numeric: stats.totalGoals,
      color: "text-result-win",
      bgColor: "bg-result-win/10",
    },
    {
      icon: TrendingUp,
      label: "Avg Goals / Match",
      value: stats.avgGoals,
      numeric: parseFloat(stats.avgGoals),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Trophy,
      label: "Top Scorer",
      value: stats.topScorer
        ? `${getPlayer(stats.topScorer.playerId)?.name} (${stats.topScorer.goalsFor})`
        : "-",
      numeric: stats.topScorer?.goalsFor ?? 0,
      color: "text-champion-gold",
      bgColor: "bg-champion-gold/10",
    },
  ];

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          League Statistics
        </h2>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <div
            key={s.label}
            className="glass-strong rounded-xl border border-white/10 p-6 card-hover slide-in-right"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className={`inline-flex p-3 rounded-lg ${s.bgColor} mb-4`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              {s.label}
            </p>
            <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {typeof s.numeric === "number" && s.label !== "Avg Goals / Match" ? (
                <AnimatedCounter value={s.numeric} />
              ) : (
                s.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="glass-strong rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">League Progress</span>
          <span className="text-sm font-bold text-primary">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {stats.matchesPlayed} of {stats.totalMatches} matches completed
        </p>
      </div>

      {/* Match Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.biggestWin && (
          <div className="glass-strong rounded-xl border border-white/10 p-6 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-result-win/10">
                <Zap className="h-5 w-5 text-result-win" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Biggest Win
                </p>
                <p className="text-xs text-muted-foreground">Goal difference: {Math.abs(stats.biggestWin.homeScore! - stats.biggestWin.awayScore!)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getPlayer(stats.biggestWin.homeId)?.avatar ? (
                      <img
                        src={getPlayer(stats.biggestWin.homeId)?.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-display font-bold text-primary">
                        {getPlayer(stats.biggestWin.homeId)?.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{getPlayer(stats.biggestWin.homeId)?.name}</span>
                </div>
                <span className="font-display text-xl font-bold text-result-win">
                  {stats.biggestWin.homeScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getPlayer(stats.biggestWin.awayId)?.avatar ? (
                      <img
                        src={getPlayer(stats.biggestWin.awayId)?.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-display font-bold text-primary">
                        {getPlayer(stats.biggestWin.awayId)?.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{getPlayer(stats.biggestWin.awayId)?.name}</span>
                </div>
                <span className="font-display text-xl font-bold text-result-loss">
                  {stats.biggestWin.awayScore}
                </span>
              </div>
            </div>
          </div>
        )}

        {stats.highestScoring && (
          <div className="glass-strong rounded-xl border border-primary/30 champion-glow p-6 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                  Highest Scoring Match
                </p>
                <p className="text-xs text-muted-foreground">{stats.highestTotal} total goals</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getPlayer(stats.highestScoring.homeId)?.avatar ? (
                      <img
                        src={getPlayer(stats.highestScoring.homeId)?.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-display font-bold text-primary">
                        {getPlayer(stats.highestScoring.homeId)?.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{getPlayer(stats.highestScoring.homeId)?.name}</span>
                </div>
                <span className="font-display text-xl font-bold text-primary">
                  {stats.highestScoring.homeScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getPlayer(stats.highestScoring.awayId)?.avatar ? (
                      <img
                        src={getPlayer(stats.highestScoring.awayId)?.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-display font-bold text-primary">
                        {getPlayer(stats.highestScoring.awayId)?.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{getPlayer(stats.highestScoring.awayId)?.name}</span>
                </div>
                <span className="font-display text-xl font-bold text-primary">
                  {stats.highestScoring.awayScore}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
