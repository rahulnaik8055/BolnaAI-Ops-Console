"use client";

export default function ConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse-green" : "bg-red-500"}`} />
      <span className="text-[11px] font-medium text-slate-500">
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
