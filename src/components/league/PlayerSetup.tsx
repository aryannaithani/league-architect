import React, { useState, useRef } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Trophy, Minus, Plus } from "lucide-react";

const PlayerSetup: React.FC = () => {
  const { players, addPlayer, removePlayer, generateLeague, fixturesGenerated, isAdmin } = useLeague();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [numLegs, setNumLegs] = useState(2);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    addPlayer(name.trim(), avatar || "");
    setName("");
    setAvatar("");
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold tracking-wide text-primary">PLAYERS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
              <div className="h-16 w-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-xl text-primary">{p.name[0]}</span>
                )}
              </div>
              <span className="text-sm font-medium truncate max-w-full">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold tracking-wide text-primary">SQUAD REGISTRATION</h2>

      {!fixturesGenerated && (
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Player Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Avatar</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:opacity-90"
            />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim()} className="gap-2">
            <UserPlus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {players.map((p) => (
          <div key={p.id} className="group relative flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 card-hover">
            {!fixturesGenerated && (
              <button
                onClick={() => removePlayer(p.id)}
                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-destructive-foreground" />
              </button>
            )}
            <div className="h-16 w-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-xl text-primary">{p.name[0]}</span>
              )}
            </div>
            <span className="text-sm font-medium truncate max-w-full">{p.name}</span>
          </div>
        ))}
      </div>

      {!fixturesGenerated && players.length >= 2 && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Rounds</label>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setNumLegs(Math.max(1, numLegs - 1))} disabled={numLegs <= 1}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-display text-lg w-8 text-center">{numLegs}</span>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setNumLegs(Math.min(4, numLegs + 1))} disabled={numLegs >= 4}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Button onClick={() => generateLeague(numLegs)} className="gap-2 gold-gradient text-primary-foreground font-display tracking-wider">
            <Trophy className="h-4 w-4" /> GENERATE FIXTURES
          </Button>
        </div>
      )}
      {!fixturesGenerated && players.length < 2 && (
        <p className="text-sm text-muted-foreground">Add at least 2 players to generate fixtures.</p>
      )}
    </div>
  );
};

export default PlayerSetup;
