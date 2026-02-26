import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const StandingsSkeleton: React.FC = () => (
  <div className="space-y-6 fade-in">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40 bg-white/5" />
      <Skeleton className="h-5 w-16 bg-white/5" />
    </div>
    <div className="glass-strong rounded-xl border border-white/10 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Skeleton className="h-4 w-6 bg-white/5" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
          <Skeleton className="h-4 w-24 bg-white/5" />
          <div className="flex-1" />
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-8 bg-white/5" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const FixturesSkeleton: React.FC = () => (
  <div className="space-y-8 fade-in">
    <Skeleton className="h-10 w-52 bg-white/5" />
    {Array.from({ length: 2 }).map((_, r) => (
      <div key={r} className="space-y-4">
        <Skeleton className="h-6 w-32 bg-white/5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-strong rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full bg-white/5" />
                <Skeleton className="h-4 w-20 bg-white/5" />
              </div>
              <Skeleton className="h-8 w-20 bg-white/5 rounded-lg" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20 bg-white/5" />
                <Skeleton className="h-12 w-12 rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="space-y-8 fade-in">
    <Skeleton className="h-10 w-48 bg-white/5" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-strong rounded-xl border border-white/10 p-5">
          <Skeleton className="h-9 w-9 rounded-lg bg-white/5 mb-3" />
          <Skeleton className="h-3 w-16 bg-white/5 mb-2" />
          <Skeleton className="h-7 w-12 bg-white/5" />
        </div>
      ))}
    </div>
  </div>
);

export const PlayersSkeleton: React.FC = () => (
  <div className="space-y-8 fade-in">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-36 bg-white/5" />
      <Skeleton className="h-5 w-24 bg-white/5" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-strong rounded-xl border border-white/10 p-6 flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-full bg-white/5 mb-3" />
          <Skeleton className="h-4 w-20 bg-white/5 mb-3" />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 bg-white/5" />
            <Skeleton className="h-8 w-8 bg-white/5" />
            <Skeleton className="h-8 w-8 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
