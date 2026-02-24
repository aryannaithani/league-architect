import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { KnockoutMatch } from "@/lib/league-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Trophy, Swords, Crown } from "lucide-react";

const Knockout: React.FC = () => {
  const { knockoutMatches, players, isAdmin, updateKnockoutResult, fixturesGenerated, leagueComplete, qualifiedPlayerIds } = useLeague();
  const [editing, setEditing] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const getPlayer = (id: string | null) => (id ? players.find((p) => p.id === id) : null);

  const semis = knockoutMatches.filter((m) => m.stage === "semi").sort((a, b) => a.matchIndex - b.matchIndex);
  const final = knockoutMatches.find((m) => m.stage === "final") || null;

  // Find the champion
  const champion = final?.played
    ? getPlayer(final.homeScore! > final.awayScore! ? final.homeId : final.awayId)
    : null;

  const handleSave = async (matchId: string) => {
    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) return;
    if (hs === as_) return; // No draws in KO
    await updateKnockoutResult(matchId, hs, as_);
    setEditing(null);
    setHomeScore("");
    setAwayScore("");
  };

  const startEdit = (match: KnockoutMatch) => {
    setEditing(match.id);
    setHomeScore(match.homeScore?.toString() ?? "");
    setAwayScore(match.awayScore?.toString() ?? "");
  };

  if (!fixturesGenerated) {
    return (
      <div className="text-center py-16 text-muted-foreground fade-in">
        <Swords className="h-12 w-12 mx-auto mb-4 text-primary/30" />
        <p className="font-display text-xl font-semibold mb-2">Knockout Round</p>
        <p className="text-sm">Complete the league phase to unlock the knockout stage</p>
      </div>
    );
  }

  // League not complete — show placeholder bracket
  const renderPlaceholder = !leagueComplete;

  const renderPlayerSlot = (playerId: string | null, side: "home" | "away", isWinner?: boolean) => {
    const player = getPlayer(playerId);
    const placeholderLabel = playerId ? player?.name : "TBD";

    return (
      <div className={`flex items-center gap-2.5 ${side === "away" ? "flex-row-reverse" : ""} ${isWinner ? "opacity-100" : playerId ? "opacity-90" : "opacity-40"}`}>
        <div className={`h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 flex items-center justify-center bg-secondary ${isWinner ? "border-champion-gold champion-glow" : "border-white/10"}`}>
          {player?.avatar ? (
            <img src={player.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-display font-bold text-primary">
              {placeholderLabel?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <span className={`font-semibold text-sm truncate ${isWinner ? "text-champion-gold" : "text-foreground"}`}>
          {placeholderLabel ?? "TBD"}
        </span>
      </div>
    );
  };

  const renderMatch = (match: KnockoutMatch | null, label: string) => {
    if (!match) return null;
    const isEditing = editing === match.id;
    const canEdit = isAdmin && !match.played && match.homeId && match.awayId;
    const homeWinner = match.played && match.homeScore! > match.awayScore!;
    const awayWinner = match.played && match.homeScore! < match.awayScore!;

    return (
      <div className="glass-strong rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          {label === "Final" ? <Crown className="h-4 w-4 text-champion-gold" /> : <Swords className="h-4 w-4 text-primary" />}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Home */}
          <div className="flex items-center justify-between">
            {renderPlayerSlot(match.homeId, "home", homeWinner)}
            {match.played && (
              <span className={`font-display text-xl font-bold ${homeWinner ? "text-result-win" : "text-muted-foreground"}`}>
                {match.homeScore}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Away */}
          <div className="flex items-center justify-between">
            {renderPlayerSlot(match.awayId, "home", awayWinner)}
            {match.played && (
              <span className={`font-display text-xl font-bold ${awayWinner ? "text-result-win" : "text-muted-foreground"}`}>
                {match.awayScore}
              </span>
            )}
          </div>

          {/* Edit / Score Input */}
          {isEditing ? (
            <div className="flex items-center justify-center gap-2 pt-2">
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
                onKeyDown={(e) => e.key === "Enter" && handleSave(match.id)}
              />
              <Button size="sm" variant="ghost" onClick={() => handleSave(match.id)} className="h-10 w-10 p-0 hover:bg-result-win/20">
                <Check className="h-5 w-5 text-result-win" />
              </Button>
            </div>
          ) : canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(match)}
              className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 mt-1"
            >
              Enter Score
            </Button>
          ) : !match.played && (!match.homeId || !match.awayId) ? (
            <p className="text-center text-xs text-muted-foreground/50 mt-1">Awaiting semifinal results</p>
          ) : null}
        </div>
      </div>
    );
  };

  // For placeholder mode, create fake matches
  const placeholderSemis: KnockoutMatch[] = renderPlaceholder
    ? [
        { id: "ph-s0", stage: "semi", matchIndex: 0, homeId: qualifiedPlayerIds[0] ?? null, awayId: qualifiedPlayerIds[3] ?? null, homeScore: null, awayScore: null, played: false },
        { id: "ph-s1", stage: "semi", matchIndex: 1, homeId: qualifiedPlayerIds[1] ?? null, awayId: qualifiedPlayerIds[2] ?? null, homeScore: null, awayScore: null, played: false },
      ]
    : semis;

  const placeholderFinal: KnockoutMatch | null = renderPlaceholder
    ? { id: "ph-f", stage: "final", matchIndex: 0, homeId: null, awayId: null, homeScore: null, awayScore: null, played: false }
    : final;

  const displaySemis = renderPlaceholder ? placeholderSemis : semis;
  const displayFinal = renderPlaceholder ? placeholderFinal : final;

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Knockout Stage
        </h2>
        {renderPlaceholder && (
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
            Provisional
          </span>
        )}
      </div>

      {champion && (
        <div className="glass-strong rounded-xl border border-champion-gold/30 champion-glow-strong p-6 text-center fade-in">
          <Crown className="h-10 w-10 mx-auto mb-3 text-champion-gold" />
          <p className="text-xs uppercase tracking-wider text-champion-gold font-semibold mb-2">Champion</p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-champion-gold flex items-center justify-center bg-secondary">
              {champion.avatar ? (
                <img src={champion.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-display font-bold text-champion-gold">{champion.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <span className="font-display text-3xl font-bold text-champion-gold">{champion.name}</span>
          </div>
        </div>
      )}

      {/* Bracket layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Semis */}
        <div className="space-y-4">
          <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground font-semibold text-center">Semifinals</h3>
          {displaySemis.map((s, i) => (
            <div key={s.id} className={renderPlaceholder ? "opacity-50" : ""}>
              {renderMatch(s, `Semi-Final ${i + 1}`)}
            </div>
          ))}
        </div>

        {/* Connector lines (visual) */}
        <div className="hidden md:flex items-center justify-center">
          <div className="w-full h-px border-t border-dashed border-white/20" />
        </div>

        {/* Final */}
        <div className="space-y-4">
          <h3 className="font-display text-sm uppercase tracking-wider text-champion-gold font-semibold text-center">Final</h3>
          <div className={renderPlaceholder ? "opacity-50" : ""}>
            {renderMatch(displayFinal, "Final")}
          </div>
        </div>
      </div>

      {renderPlaceholder && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Complete all league matches to start the knockout stage. Top 4 qualify.
          </p>
        </div>
      )}
    </div>
  );
};

export default Knockout;
