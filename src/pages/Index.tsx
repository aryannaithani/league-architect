import React, { useState } from "react";
import { LeagueProvider, useLeague } from "@/context/LeagueContext";
import PlayerSetup from "@/components/league/PlayerSetup";
import Fixtures from "@/components/league/Fixtures";
import Standings from "@/components/league/Standings";
import Stats from "@/components/league/Stats";
import AdminGate from "@/components/league/AdminGate";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Menu, X } from "lucide-react";
import bgUcl from "@/assets/bg-ucl.jpg";

type Tab = "standings" | "fixtures" | "players" | "stats";

const LeagueApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("standings");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, resetLeague, fixturesGenerated } = useLeague();

  const tabs: { key: Tab; label: string }[] = [
    { key: "standings", label: "Standings" },
    { key: "fixtures", label: "Fixtures" },
    { key: "players", label: "Players" },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${bgUcl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(210,100%,50%,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10">
        {/* Sticky Header with Glassmorphism */}
        <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <Trophy className="h-6 w-6 md:h-7 md:w-7 text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <div className="absolute inset-0 text-primary blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                </div>
                <h1 className="font-display text-lg md:text-2xl font-bold tracking-tight uppercase neon-highlight">
                  eFootball League
                </h1>
              </div>
              
              <div className="hidden md:flex items-center gap-4">
                {isAdmin && fixturesGenerated && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetLeague} 
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                  >
                    <RotateCcw className="h-4 w-4" /> 
                    <span className="text-xs font-medium">Reset</span>
                  </Button>
                )}
                <AdminGate />
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu backdrop */}
          {mobileMenuOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 top-16"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden glass-strong border-t border-white/10 slide-in-right relative z-50">
              <div className="container max-w-7xl mx-auto px-4 py-4 space-y-3">
                {isAdmin && fixturesGenerated && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      resetLeague();
                      setMobileMenuOpen(false);
                    }} 
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <RotateCcw className="h-4 w-4" /> 
                    <span>Reset League</span>
                  </Button>
                )}
                <div className="pt-2 border-t border-white/10">
                  <AdminGate />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Navigation Tabs */}
        <nav className="sticky top-16 md:top-20 z-40 glass border-b border-white/10">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`relative px-4 md:px-6 py-4 font-display text-xs md:text-sm font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.key
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary neon-highlight" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content with fade-in animation */}
        <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="fade-in">
            {activeTab === "standings" && <Standings />}
            {activeTab === "fixtures" && <Fixtures />}
            {activeTab === "players" && <PlayerSetup />}
            {activeTab === "stats" && <Stats />}
          </div>
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
