import React from "react";

interface Props {
  isUpdating: boolean;
  isStale: boolean;
}

const UpdatingIndicator: React.FC<Props> = ({ isUpdating, isStale }) => {
  if (!isUpdating) return null;

  return (
    <div
      className={`fixed top-2 right-2 md:top-4 md:right-4 z-[100] flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong border transition-all duration-500 ${
        isStale ? "border-primary/40 shadow-[0_0_12px_-2px_hsl(210,100%,50%,0.3)]" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {isStale ? "Refreshing" : "Updating"}
      </span>
    </div>
  );
};

export default UpdatingIndicator;
