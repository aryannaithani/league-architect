import React, { useState, useMemo } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Calendar } from "lucide-react";

const Fixtures: React.FC = () => {
  const { matches, players, updateMatchResult, isAdmin, fixturesGenerated } = useLeague();
  const [editing, setEditing] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const rounds = useMemo(
    () => [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b),
    [matches]
  );

  // Find highest scoring match for highlighting
  const highestScoringMatch = useMemo(() => {
    const playedMatches = matches.filter((m) => m.played);
    if (playedMatches.length === 0) return null;
    return playedMatches.reduce((max, m) => {
      const total = (m.homeScore ?? 0) + (m.awayScore ?? 0);
      const maxTotal = (max.homeScore ?? 0) + (max.awayScore ?? 0);
      return total > maxTotal ? m : max;
    });
  }, [matches]);

  const handleSave = async (matchId: string) => {
    const hs = parseInt(homeScore);
    const as = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) return;
    await updateMatchResult(matchId, hs, as);
    setEditing(null);
    setHomeScore("");
    setAwayScore("");
  };

  const startEdit = (matchId: string, m: typeof matches[0]) => {
    setEditing(matchId);
    setHomeScore(m.homeScore?.toString() ?? "");
    setAwayScore(m.awayScore?.toString() ?? "");
  };

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-16 text-muted-foreground fade-in">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-primary/30" />
        <p className="font-display text-xl font-semibold mb-2">No Fixtures Yet</p>
        <p className="text-sm">Generate the league to see match fixtures</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Matchday Fixtures
        </h2>
      </div>

      {rounds.map((round) => {
        const roundMatches = matches.filter((m) => m.round === round);
        const playedCount = roundMatches.filter((m) => m.played).length;

        return (
          <div key={round} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display text-lg md:text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Matchday {round}
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                {playedCount} / {roundMatches.length} played
              </span>
            </div>

            <div className="space-y-3">
              {roundMatches.map((m) => {
                const home = getPlayer(m.homeId);
                const away = getPlayer(m.awayId);
                const isEditing = editing === m.id;
                const isHighestScoring = highestScoringMatch?.id === m.id && m.played;
                const totalGoals = (m.homeScore ?? 0) + (m.awayScore ?? 0);

                return (
                  <div
                    key={m.id}
                    className={`glass-strong rounded-xl border overflow-hidden transition-all duration-300 card-hover ${
                      m.played
                        ? isHighestScoring
                          ? "border-primary/50 champion-glow"
                          : "border-white/10"
                        : "border-white/5 opacity-75"
                    }`}
                  >
                    <div className="p-4 md:p-6">
                      <div className="flex items-center justify-between gap-4">
                        {/* Home Team */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 flex items-center justify-center bg-secondary">
                            {home?.avatar ? (
                              <img src={home.avatar} alt={home.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-lg font-display font-bold text-primary">
                                {home?.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-sm md:text-base truncate">{home?.name}</span>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-3 min-w-[140px] justify-center">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                value={homeScore}
                                onChange={(e) => setHomeScore(e.target.value)}
                                className="w-14 h-10 text-center bg-white/5 border-white/10 text-lg font-bold focus:border-primary"
                                autoFocus
                              />
                              <span className="text-muted-foreground font-bold">-</span>
                              <Input
                                type="number"
                                min={0}
                                value={awayScore}
                                onChange={(e) => setAwayScore(e.target.value)}
                                className="w-14 h-10 text-center bg-white/5 border-white/10 text-lg font-bold focus:border-primary"
                                onKeyDown={(e) => e.key === "Enter" && handleSave(m.id)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSave(m.id)}
                                className="h-10 w-10 p-0 hover:bg-result-win/20"
                              >
                                <Check className="h-5 w-5 text-result-win" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => isAdmin && !m.played && startEdit(m.id, m)}
                              className={`font-display text-2xl md:text-3xl font-bold tracking-tight px-4 py-2 rounded-lg transition-all ${
                                m.played
                                  ? isHighestScoring
                                    ? "text-primary neon-highlight bg-primary/10"
                                    : "text-foreground bg-white/5"
                                  : "text-muted-foreground bg-white/5"
                              } ${isAdmin && !m.played ? "cursor-pointer hover:bg-white/10 hover:text-foreground" : "cursor-default"}`}
                            >
                              {m.played ? (
                                <span className="pulse-score">
                                  {m.homeScore} - {m.awayScore}
                                </span>
                              ) : (
                                "vs"
                              )}
                            </button>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                          <span className="font-semibold text-sm md:text-base truncate text-right">{away?.name}</span>
                          <div className="h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 flex items-center justify-center bg-secondary">
                            {away?.avatar ? (
                              <img src={away.avatar} alt={away.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-lg font-display font-bold text-primary">
                                {away?.name[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isHighestScoring && m.played && (
                        <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-center gap-2 text-xs text-primary font-semibold">
                          <span>🔥 Highest Scoring Match ({totalGoals} goals)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Fixtures;
