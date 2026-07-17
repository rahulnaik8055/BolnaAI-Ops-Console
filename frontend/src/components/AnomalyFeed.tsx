"use client";

import { useState } from "react";
import { AnomalyEntry } from "@/lib/types";
import { getAnomalyColor, shortId, timeAgo } from "@/lib/utils";
import { AlertTriangle, ChevronRight, X } from "lucide-react";

function AnomalyPill({ flag }: { flag: string }) {
  const label = flag.split(":")[0];
  const detail = flag.includes(":") ? flag.split(":").slice(1).join(":").trim() : null;
  const colors = getAnomalyColor(flag);

  return (
    <span
      title={flag}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold font-mono ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {label}
      {detail && (
        <span className="font-normal opacity-60">{detail}</span>
      )}
    </span>
  );
}

export default function AnomalyFeed({ anomalies }: { anomalies: AnomalyEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasAnomalies = anomalies.length > 0;

  // Collapsed state: slim strip at the top
  if (!expanded) {
    return (
      <div
        className={`border-b border-border px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
          hasAnomalies ? "bg-amber-50 hover:bg-amber-100" : "bg-bg-secondary hover:bg-bg-primary"
        }`}
        onClick={() => hasAnomalies && setExpanded(true)}
      >
        <AlertTriangle className={`h-3.5 w-3.5 ${hasAnomalies ? "text-amber-500" : "text-text-muted"}`} />
        <span className={`text-xs font-semibold ${hasAnomalies ? "text-amber-700" : "text-text-muted"}`}>
          Anomalies
        </span>
        {hasAnomalies && (
          <span className="rounded-full bg-amber-200 text-amber-800 px-1.5 py-0.5 text-[10px] font-bold">
            {anomalies.length}
          </span>
        )}
        {hasAnomalies && (
          <ChevronRight className="h-3.5 w-3.5 text-amber-500 ml-auto" />
        )}
      </div>
    );
  }

  // Expanded state: full panel
  return (
    <div className="border-b border-border bg-bg-secondary">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-text-primary">Anomalies</span>
        <span className="ml-auto text-[10px] font-mono text-text-muted">
          {anomalies.length}
        </span>
        <button
          onClick={() => setExpanded(false)}
          className="ml-1 rounded p-0.5 hover:bg-bg-primary text-text-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {anomalies.map((entry, i) => (
          <div
            key={`${entry.callId}-${i}`}
            className="px-4 py-2.5 hover:bg-bg-primary transition-colors border-b border-border last:border-b-0"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-text-secondary">
                {shortId(entry.callId)}
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                {entry.timestamp ? timeAgo(entry.timestamp) + " ago" : "now"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {entry.anomalies.map((a) => (
                <AnomalyPill key={a} flag={a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
