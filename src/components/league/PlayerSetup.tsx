import React, { useState, useRef, useMemo, useCallback } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Trophy, Minus, Plus, Users } from "lucide-react";

// Generate deterministic random ratings 80-100 based on player id
function getPlayerRatings(playerId: string) {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
    hash |= 0;
  }
  const att = 80 + Math.abs(hash % 21);
  const mid = 80 + Math.abs((hash * 7) % 21);
  const def = 80 + Math.abs((hash * 13) % 21);
  return { att, mid, def };
}

function RatingBadge({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? "text-result-win" : value >= 85 ? "text-champion-gold" : "text-muted-foreground";
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
    </div>
  );
}

interface PlayerCardProps {
  player: any;
  idx: number;
  isEliminated: boolean;
  isAdmin: boolean;
  fixturesGenerated: boolean;
  onRemove: (id: string) => void;
  onHoverStart: (player: any) => void;
  onHoverEnd: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player: p,
  idx,
  isEliminated,
  isAdmin,
  fixturesGenerated,
  onRemove,
  onHoverStart,
  onHoverEnd,
}) => {
  const ratings = useMemo(() => getPlayerRatings(p.id), [p.id]);

  return (
    <div
      className={`group relative glass-strong rounded-xl border border-white/10 overflow-hidden card-hover slide-in-right ${isEliminated ? "opacity-30 grayscale" : ""}`}
      style={{ animationDelay: `${idx * 50}ms` }}
      onMouseEnter={() => onHoverStart(p)}
      onMouseLeave={onHoverEnd}
      onFocus={() => onHoverStart(p)}
      onBlur={onHoverEnd}
      tabIndex={0}
    >
      {isAdmin && !fixturesGenerated && (
        <button
          onClick={() => onRemove(p.id)}
          className="absolute top-2 right-2 z-20 rounded-full bg-destructive p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
        >
          <X className="h-3.5 w-3.5 text-destructive-foreground" />
        </button>
      )}

      <div className="relative p-6 flex flex-col items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50" />
        <div className="relative z-10 mb-3">
          <div className={`h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-primary/30 champion-glow flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${isAdmin ? "transition-transform group-hover:scale-110" : ""}`}>
            {p.avatar ? (
              <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-3xl md:text-4xl font-bold text-primary">
                {p.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <h3 className="relative z-10 font-display text-base md:text-lg font-bold text-foreground text-center truncate w-full">
          {p.name}
        </h3>
        {isEliminated && (
          <span className="relative z-10 text-[10px] uppercase tracking-wider text-result-loss font-semibold mt-1">Eliminated</span>
        )}
        {/* Ratings */}
        <div className="relative z-10 flex items-center gap-3 mt-3 pt-3 border-t border-white/10 w-full justify-center">
          <RatingBadge label="ATT" value={ratings.att} />
          <RatingBadge label="MID" value={ratings.mid} />
          <RatingBadge label="DEF" value={ratings.def} />
        </div>
      </div>
    </div>
  );
};

const PlayerSetup: React.FC = () => {
  const { players, addPlayer, removePlayer, generateLeague, fixturesGenerated, isAdmin, eliminatedPlayerIds } = useLeague();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [numLegs, setNumLegs] = useState(2);
  const fileRef = useRef<HTMLInputElement>(null);
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addPlayer(name.trim(), avatar || "");
    setName("");
    setAvatar("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const playHoverAudio = useCallback((player: any) => {
    // Only play audio for specific players (case-insensitive, trimmed)
    if (!player?.name) return;
    const normalized = String(player.name).trim().toLowerCase();

    let file: string | null = null;
    if (normalized === "naithani") {
      file = "/audio/naithani.mp3";
    } else if (normalized === "aryansh") {
      file = "/audio/aryansh.mp3";
    }
    if (!file) return;

    try {
      if (hoverAudioRef.current) {
        hoverAudioRef.current.pause();
        hoverAudioRef.current.currentTime = 0;
      }
      const audio = new Audio(file);
      audio.volume = 0.6;
      hoverAudioRef.current = audio;
      audio.play().catch(() => {});
    } catch (err) {
      console.error("Failed to play hover audio", err);
    }
  }, []);

  const stopHoverAudio = useCallback(() => {
    if (!hoverAudioRef.current) return;
    try {
      hoverAudioRef.current.pause();
      hoverAudioRef.current.currentTime = 0;
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {isAdmin ? "Squad Registration" : "Squad"}
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="font-semibold">{players.length} players</span>
        </div>
      </div>

      {isAdmin && !fixturesGenerated && (
        <div className="glass-strong rounded-xl border border-white/10 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Player Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter player name..."
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="bg-white/5 border-white/10 focus:border-primary h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avatar</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90 transition-opacity"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={!name.trim()} className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4" /> Add Player
              </Button>
            </div>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary/30" />
          <p className="font-display text-xl font-semibold mb-2">No Players Yet</p>
          <p className="text-sm">{isAdmin ? "Add players to build your squad" : "Players will appear here once added"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {players.map((p, idx) => (
            <PlayerCard
              key={p.id}
              player={p}
              idx={idx}
              isEliminated={eliminatedPlayerIds.includes(p.id)}
              isAdmin={isAdmin}
              fixturesGenerated={fixturesGenerated}
              onRemove={removePlayer}
              onHoverStart={playHoverAudio}
              onHoverEnd={stopHoverAudio}
            />
          ))}
        </div>
      )}

      {isAdmin && !fixturesGenerated && players.length >= 2 && (
        <div className="glass-strong rounded-xl border border-white/10 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Rounds:</label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-white/10 hover:bg-white/5" onClick={() => setNumLegs(Math.max(1, numLegs - 1))} disabled={numLegs <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-display text-xl font-bold w-10 text-center">{numLegs}</span>
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0 border-white/10 hover:bg-white/5" onClick={() => setNumLegs(Math.min(4, numLegs + 1))} disabled={numLegs >= 4}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={() => generateLeague(numLegs)}
              className="gap-2 gold-gradient text-primary-foreground font-display tracking-wider font-bold px-6 py-6 h-auto hover:scale-105 transition-transform champion-glow-strong"
            >
              <Trophy className="h-5 w-5" /> GENERATE FIXTURES
            </Button>
          </div>
        </div>
      )}
      {isAdmin && !fixturesGenerated && players.length < 2 && (
        <div className="glass rounded-xl border border-white/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Add at least <span className="font-semibold text-foreground">2 players</span> to generate fixtures
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerSetup;
