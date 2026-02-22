import React, { useState } from "react";
import { LeagueProvider, useLeague } from "@/context/LeagueContext";
import PlayerSetup from "@/components/league/PlayerSetup";
import Fixtures from "@/components/league/Fixtures";
import Standings from "@/components/league/Standings";
import Stats from "@/components/league/Stats";
import AdminGate from "@/components/league/AdminGate";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw } from "lucide-react";
import bgUcl from "@/assets/bg-ucl.jpg";

type Tab = "standings" | "fixtures" | "players" | "stats";

const LeagueApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("standings");
  const { isAdmin, resetLeague, fixturesGenerated } = useLeague();

  const tabs: { key: Tab; label: string }[] = [
    { key: "standings", label: "Standings" },
    { key: "fixtures", label: "Fixtures" },
    { key: "players", label: "Players" },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* UCL Background */}
      <div
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url(${bgUcl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-wider uppercase">
              eFootball League
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && fixturesGenerated && (
              <Button variant="ghost" size="sm" onClick={resetLeague} className="gap-1.5 text-muted-foreground text-xs">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
            <AdminGate />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-border bg-card/50">
        <div className="container max-w-4xl mx-auto px-4 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 font-display text-sm uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6">
        {activeTab === "standings" && <Standings />}
        {activeTab === "fixtures" && <Fixtures />}
        {activeTab === "players" && <PlayerSetup />}
        {activeTab === "stats" && <Stats />}
      </main>
      </div>
    </div>
  );
};

const Index: React.FC = () => (
  <LeagueProvider>
    <LeagueApp />
  </LeagueProvider>
);

export default Index;
