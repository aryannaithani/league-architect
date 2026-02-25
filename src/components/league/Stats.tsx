import React, { useEffect, useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { getLeagueStats, calculateStandings } from "@/lib/league-utils";
import { Target, TrendingUp, BarChart3, Trophy, Zap, Award, ShieldCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const POSITION_COLORS = [
  "hsl(210, 100%, 50%)",
  "hsl(43, 96%, 56%)",
  "hsl(152, 70%, 45%)",
  "hsl(0, 70%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(180, 60%, 45%)",
  "hsl(30, 80%, 50%)",
  "hsl(330, 60%, 55%)",
  "hsl(60, 70%, 45%)",
  "hsl(120, 50%, 40%)",
];

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(value * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Stats: React.FC = () => {
  const { players, matches, knockoutMatches, fixturesGenerated } = useLeague();

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-16 text-muted-foreground fade-in">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary/30" />
        <p className="font-display text-xl font-semibold mb-2">No Stats Yet</p>
        <p className="text-sm">Play some matches to see statistics</p>
      </div>
    );
  }

  // Combine league + KO matches for cumulative stats
  const allMatches = useMemo(() => [
    ...matches,
    ...knockoutMatches.filter((m) => m.played && m.homeId && m.awayId).map((m) => ({
      id: m.id, round: 999, homeId: m.homeId!, awayId: m.awayId!, homeScore: m.homeScore, awayScore: m.awayScore, played: m.played,
    })),
  ], [matches, knockoutMatches]);

  const stats = useMemo(() => getLeagueStats(players, allMatches), [players, allMatches]);
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  // Best defense (least goals conceded among players who have played)
  const standings = useMemo(() => calculateStandings(players, allMatches), [players, allMatches]);
  const bestDefense = useMemo(() => {
    const played = standings.filter((s) => s.played > 0);
    return played.length > 0 ? played.reduce((a, b) => a.goalsAgainst < b.goalsAgainst ? a : b) : null;
  }, [standings]);

  const progressPercentage = stats.totalMatches > 0 ? (stats.matchesPlayed / stats.totalMatches) * 100 : 0;

  // Position history chart data
  const positionData = useMemo(() => {
    if (players.length === 0) return [];
    const leagueMatches = matches.filter(m => m.played);
    const rounds = [...new Set(leagueMatches.map(m => m.round))].sort((a, b) => a - b);
    if (rounds.length === 0) return [];

    return rounds.map(round => {
      const matchesUpToRound = matches.filter(m => m.played && m.round <= round);
      const standingsAtRound = calculateStandings(players, matchesUpToRound);
      const entry: any = { round: `MD${round}` };
      standingsAtRound.forEach((s, idx) => {
        const player = getPlayer(s.playerId);
        if (player) entry[player.name] = idx + 1;
      });
      return entry;
    });
  }, [players, matches]);

  const statCards = [
    {
      icon: BarChart3,
      label: "Matches Played",
      value: `${stats.matchesPlayed} / ${stats.totalMatches}`,
      numeric: stats.matchesPlayed,
      color: "text-primary",
      bgColor: "bg-primary/10",
      displayValue: `${stats.matchesPlayed} / ${stats.totalMatches}`,
    },
    {
      icon: Target,
      label: "Total Goals",
      numeric: stats.totalGoals,
      color: "text-result-win",
      bgColor: "bg-result-win/10",
    },
    {
      icon: TrendingUp,
      label: "Avg Goals / Match",
      displayValue: stats.avgGoals,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Trophy,
      label: "Best Attack",
      displayValue: stats.topScorer ? getPlayer(stats.topScorer.playerId)?.name ?? "-" : "-",
      subtitle: stats.topScorer ? `${stats.topScorer.goalsFor} goals` : undefined,
      color: "text-champion-gold",
      bgColor: "bg-champion-gold/10",
    },
    {
      icon: ShieldCheck,
      label: "Best Defense",
      displayValue: bestDefense ? getPlayer(bestDefense.playerId)?.name ?? "-" : "-",
      subtitle: bestDefense ? `${bestDefense.goalsAgainst} conceded` : undefined,
      color: "text-result-win",
      bgColor: "bg-result-win/10",
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s, idx) => (
          <div
            key={s.label}
            className="glass-strong rounded-xl border border-white/10 p-5 card-hover slide-in-right"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className={`inline-flex p-2.5 rounded-lg ${s.bgColor} mb-3`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              {s.label}
            </p>
            <p className="font-display text-xl md:text-2xl font-bold text-foreground">
              {s.displayValue ?? (s.numeric !== undefined ? <AnimatedCounter value={s.numeric} /> : "-")}
            </p>
            {s.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Position History Chart */}
      {positionData.length > 1 && (
        <div className="glass-strong rounded-xl border border-white/10 p-6">
          <h3 className="font-display text-lg font-bold text-foreground mb-4">Position History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={positionData}>
              <XAxis dataKey="round" stroke="hsl(220, 10%, 65%)" tick={{ fontSize: 11 }} />
              <YAxis
                reversed
                domain={[1, players.length]}
                ticks={Array.from({ length: players.length }, (_, i) => i + 1)}
                stroke="hsl(220, 10%, 65%)"
                tick={{ fontSize: 11 }}
                label={{ value: "Position", angle: -90, position: "insideLeft", fill: "hsl(220, 10%, 65%)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 30%, 12%)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(0, 0%, 98%)" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {players.map((p, i) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.name}
                  stroke={POSITION_COLORS[i % POSITION_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Biggest Win</p>
                <p className="text-xs text-muted-foreground">Goal difference: {Math.abs(stats.biggestWin.homeScore! - stats.biggestWin.awayScore!)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[stats.biggestWin.homeId, stats.biggestWin.awayId].map((pid, i) => (
                <div key={pid} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {getPlayer(pid)?.avatar ? (
                        <img src={getPlayer(pid)?.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-display font-bold text-primary">{getPlayer(pid)?.name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <span className="font-semibold text-sm">{getPlayer(pid)?.name}</span>
                  </div>
                  <span className={`font-display text-xl font-bold ${i === 0 ? "text-result-win" : "text-result-loss"}`}>
                    {i === 0 ? stats.biggestWin!.homeScore : stats.biggestWin!.awayScore}
                  </span>
                </div>
              ))}
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
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">Highest Scoring Match</p>
                <p className="text-xs text-muted-foreground">{stats.highestTotal} total goals</p>
              </div>
            </div>
            <div className="space-y-2">
              {[stats.highestScoring.homeId, stats.highestScoring.awayId].map((pid, i) => (
                <div key={pid} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-secondary border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {getPlayer(pid)?.avatar ? (
                        <img src={getPlayer(pid)?.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-display font-bold text-primary">{getPlayer(pid)?.name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <span className="font-semibold text-sm">{getPlayer(pid)?.name}</span>
                  </div>
                  <span className="font-display text-xl font-bold text-primary">
                    {i === 0 ? stats.highestScoring!.homeScore : stats.highestScoring!.awayScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
