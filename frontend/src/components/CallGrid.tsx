"use client";

import { CallExecution, LatencyBaseline } from "@/lib/types";
import CallCard from "./CallCard";

export default function CallGrid({
  calls,
  latency,
}: {
  calls: CallExecution[];
  latency: LatencyBaseline | null;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <span className="text-xs font-bold text-text-primary tracking-wide">
          LIVE CALLS
        </span>
        <span className="ml-auto rounded-full bg-bg-primary border border-border px-2 py-0.5 text-[10px] font-mono text-text-secondary">
          {calls.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {calls.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <span className="text-sm">Waiting for calls...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {calls.map((call) => (
              <CallCard key={call.id} call={call} p95={latency?.p95TimeToFirstAudio ?? null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
