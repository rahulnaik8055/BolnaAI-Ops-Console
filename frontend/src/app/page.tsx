"use client";

import { useState } from "react";
import { useCallsSocket } from "@/hooks/useCallsSocket";
import Header from "@/components/Header";
import AnomalyFeed from "@/components/AnomalyFeed";
import CallGrid from "@/components/CallGrid";
import CostPanel from "@/components/CostPanel";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";

export default function Home() {
  const { connected, sortedCalls, stats, latency, anomalies } = useCallsSocket();
  const [costExpanded, setCostExpanded] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <Header connected={connected} latency={latency} />

      {/* Anomaly feed: collapsed strip above call list */}
      <AnomalyFeed anomalies={anomalies} />

      {/* Main call list — full width */}
      <main className="flex-1 overflow-hidden">
        <CallGrid calls={sortedCalls} latency={latency} />
      </main>

      {/* Cost panel: collapsible bottom section */}
      <div className="border-t border-border bg-bg-secondary">
        <button
          onClick={() => setCostExpanded(!costExpanded)}
          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-bg-primary transition-colors"
        >
          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-text-primary tracking-wide">COST</span>
          {stats && (
            <span className="text-[11px] font-mono text-text-secondary ml-1">
              {stats.callCount} calls &middot; {`$${stats.totalSpend.toFixed(2)}`}
            </span>
          )}
          <span className="ml-auto text-text-muted">
            {costExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </span>
        </button>
        {costExpanded && (
          <div className="px-4 pb-4">
            <CostPanel stats={stats} />
          </div>
        )}
      </div>
    </div>
  );
}
