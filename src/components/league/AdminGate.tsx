import React, { useState, useRef, useEffect } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, LogOut, Lock } from "lucide-react";

const AdminGate: React.FC = () => {
  const { isAdmin, loginAdmin, logoutAdmin } = useLeague();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPassword("");
        setError(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (isAdmin) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={logoutAdmin}
        className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
      >
        <LogOut className="h-4 w-4" />
        <span className="text-xs font-medium">Logout</span>
      </Button>
    );
  }

  const handleLogin = async () => {
    setIsLoading(true);
    const success = await loginAdmin(password);
    if (success) {
      setPassword("");
      setError(false);
      setIsOpen(false);
    } else {
      setError(true);
    }
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
      >
        <Shield className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2 fade-in">
      <Lock className="h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
        className={`w-32 h-9 text-xs bg-white/5 border-white/10 focus:border-primary ${
          error ? "border-destructive" : ""
        }`}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleLogin}
        disabled={isLoading}
        className="h-9 w-9 p-0 hover:bg-white/5"
      >
        <Shield className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AdminGate;
