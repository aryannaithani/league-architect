import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

const Fixtures: React.FC = () => {
  const { matches, players, updateMatchResult, isAdmin, fixturesGenerated } = useLeague();
  const [editing, setEditing] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-display text-lg">No fixtures yet.</p>
        <p className="text-sm mt-1">Generate the league to see match fixtures.</p>
      </div>
    );
  }

  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  const handleSave = (matchId: string) => {
    const hs = parseInt(homeScore);
    const as = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) return;
    updateMatchResult(matchId, hs, as);
    setEditing(null);
    setHomeScore("");
    setAwayScore("");
  };

  const startEdit = (matchId: string, m: typeof matches[0]) => {
    setEditing(matchId);
    setHomeScore(m.homeScore?.toString() ?? "");
    setAwayScore(m.awayScore?.toString() ?? "");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold tracking-wide text-primary">MATCHDAY FIXTURES</h2>

      {rounds.map((round) => (
        <div key={round} className="space-y-2">
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Matchday {round}
          </h3>
          <div className="space-y-2">
            {matches
              .filter((m) => m.round === round)
              .map((m) => {
                const home = getPlayer(m.homeId);
                const away = getPlayer(m.awayId);
                const isEditing = editing === m.id;

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between rounded-lg border bg-card p-3 transition-colors ${
                      m.played ? "border-border" : "border-border/50"
                    }`}
                  >
                    {/* Home */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-sm font-medium truncate">{home?.name}</span>
                      <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {home?.avatar ? (
                          <img src={home.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-display text-primary">{home?.name[0]}</span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="mx-4 flex items-center gap-2 min-w-[120px] justify-center">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={homeScore}
                            onChange={(e) => setHomeScore(e.target.value)}
                            className="w-12 h-8 text-center bg-secondary p-1"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="number"
                            min={0}
                            value={awayScore}
                            onChange={(e) => setAwayScore(e.target.value)}
                            className="w-12 h-8 text-center bg-secondary p-1"
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleSave(m.id)} className="h-8 w-8 p-0">
                            <Check className="h-4 w-4 text-result-win" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => isAdmin && startEdit(m.id, m)}
                          className={`font-display text-lg tracking-wider px-3 py-1 rounded ${
                            m.played
                              ? "bg-secondary"
                              : "bg-secondary/50 text-muted-foreground"
                          } ${isAdmin ? "cursor-pointer hover:bg-accent transition-colors" : "cursor-default"}`}
                        >
                          {m.played ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                        </button>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {away?.avatar ? (
                          <img src={away.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-display text-primary">{away?.name[0]}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium truncate">{away?.name}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Fixtures;
