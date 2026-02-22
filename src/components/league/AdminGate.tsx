import React, { useState } from "react";
import { useLeague } from "@/context/LeagueContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, LogOut, Lock } from "lucide-react";

const AdminGate: React.FC = () => {
  const { isAdmin, loginAdmin, logoutAdmin } = useLeague();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (isAdmin) {
    return (
      <Button variant="ghost" size="sm" onClick={logoutAdmin} className="gap-2 text-muted-foreground">
        <LogOut className="h-3.5 w-3.5" />
        <span className="text-xs">Logout</span>
      </Button>
    );
  }

  const handleLogin = () => {
    if (loginAdmin(password)) {
      setPassword("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      <Input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(false); }}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        className={`w-32 h-8 text-xs bg-secondary ${error ? "border-destructive" : ""}`}
      />
      <Button size="sm" variant="ghost" onClick={handleLogin} className="h-8 px-2">
        <Shield className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default AdminGate;
