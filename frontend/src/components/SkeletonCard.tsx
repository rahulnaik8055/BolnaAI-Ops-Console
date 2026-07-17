"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-white p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-4 w-14 rounded-full bg-slate-100 animate-pulse" />
        <div className="h-3 w-10 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
      <div className="flex gap-1.5">
        <div className="h-4 w-14 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-14 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-14 rounded bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonTile() {
  return (
    <div className="rounded-lg border border-border bg-white p-3 space-y-1.5">
      <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
      <div className="h-6 w-20 rounded bg-slate-100 animate-pulse" />
    </div>
  );
}
