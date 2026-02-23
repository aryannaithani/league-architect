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
  const tabRefs = React.useRef<Record<Tab, HTMLButtonElement | null>>({ standings: null, fixtures: null, players: null, stats: null });
  const [underlineStyle, setUnderlineStyle] = React.useState<{ left: number; width: number }>({ left: 0, width: 0 });

  React.useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setUnderlineStyle({ left: elRect.left - parentRect.left, width: elRect.width });
      }
    }
  }, [activeTab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "standings", label: "Standings" },
    { key: "fixtures", label: "Fixtures" },
    { key: "players", label: "Players" },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background */}
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
        {/* Header */}
        <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 md:h-16">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-base md:text-xl font-bold tracking-tight uppercase">
                  eFootball League
                </h1>
              </div>

              {/* Desktop nav tabs */}
              <nav className="hidden md:flex items-center gap-1 relative">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    ref={(el) => { tabRefs.current[tab.key] = el; }}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                      activeTab === tab.key
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <span
                  className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-in-out"
                  style={{ left: underlineStyle.left, width: underlineStyle.width }}
                />
              </nav>

              <div className="hidden md:flex items-center gap-3">
                {isAdmin && fixturesGenerated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetLeague}
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs font-medium">Reset</span>
                  </Button>
                )}
                <AdminGate />
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu backdrop */}
          {mobileMenuOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 top-14"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile dropdown with tabs + admin */}
          {mobileMenuOpen && (
            <div className="md:hidden glass-strong border-t border-white/10 slide-in-right relative z-50">
              <div className="container max-w-7xl mx-auto px-4 py-3 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${
                      activeTab === tab.key
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
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
                  <AdminGate />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
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
