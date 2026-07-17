"use client";

import { useState } from "react";
import { CallExecution } from "@/lib/types";
import { getStatusColor, formatMs, formatCost, formatDuration, timeAgo } from "@/lib/utils";
import { ChevronDown, ChevronUp, Phone, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

function StatusIcon({ status }: { status: string }) {
  const sc = getStatusColor(status);
  if (status === "in-progress")
    return <Loader2 className={`h-5 w-5 animate-spin ${sc.text}`} />;
  if (status === "completed")
    return <CheckCircle2 className={`h-5 w-5 ${sc.text}`} />;
  if (["queued", "initiated", "ringing"].includes(status))
    return <Clock className={`h-5 w-5 ${sc.text}`} />;
  return <XCircle className={`h-5 w-5 ${sc.text}`} />;
}

export default function CallCard({
  call,
  p95,
}: {
  call: CallExecution;
  p95: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = getStatusColor(call.status);
  const highLatency = call.timeToFirstAudio != null && p95 != null && call.timeToFirstAudio > p95;

  return (
    <div
      className={`rounded-xl border-2 bg-bg-card p-4 transition-all hover:shadow-sm cursor-pointer ${sc.border}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Primary: Status as the hero element */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${sc.iconBg}`}>
            <StatusIcon status={call.status} />
          </div>
          <div>
            <span className={`text-sm font-bold uppercase tracking-wide ${sc.text}`}>
              {call.status}
            </span>
            {highLatency && (
              <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                <AlertTriangle className="h-2.5 w-2.5" />
                HIGH LATENCY
              </span>
            )}
            <p className="text-[11px] text-text-muted mt-0.5">
              {timeAgo(call.createdAt)} ago
            </p>
          </div>
        </div>
        <button
          className="rounded-md p-1 hover:bg-bg-primary transition-colors text-text-muted"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Secondary: Metrics row — muted, not dominant */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        {call.timeToFirstAudio != null && (
          <span className="font-mono">
            <span className="text-text-muted">TTFA </span>
            <span className={`font-semibold ${highLatency ? "text-red-600" : ""}`}>
              {formatMs(call.timeToFirstAudio)}
            </span>
          </span>
        )}
        {call.totalCost != null && call.totalCost > 0 && (
          <span className="font-mono">
            <span className="text-text-muted">Cost </span>
            <span className="font-semibold">{formatCost(call.totalCost)}</span>
          </span>
        )}
        {call.conversationDuration != null && (
          <span className="font-mono">
            <span className="text-text-muted">Duration </span>
            <span className="font-semibold">{formatDuration(call.conversationDuration)}</span>
          </span>
        )}
      </div>

      {/* Tertiary: Phone details behind expand */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-text-secondary">
            <Phone className="h-3 w-3 text-text-muted" />
            <span>{call.fromNumber || call.userNumber || "--"}</span>
            <span className="text-text-muted">&rarr;</span>
            <span>{call.toNumber || call.agentNumber || "--"}</span>
          </div>

          {call.summary && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-0.5">Summary</span>
              <p className="text-xs text-text-secondary leading-relaxed">{call.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
            <div>
              <span className="text-text-muted">Agent:</span>{" "}
              <span className="text-text-secondary">{call.agentId}</span>
            </div>
            <div>
              <span className="text-text-muted">Provider:</span>{" "}
              <span className="text-text-secondary">{call.provider || "--"}</span>
            </div>
            {call.hangupBy && (
              <div>
                <span className="text-text-muted">Hangup:</span>{" "}
                <span className="text-text-secondary">{call.hangupBy}</span>
              </div>
            )}
            {call.errorMessage && (
              <div className="col-span-2">
                <span className="text-text-muted">Error:</span>{" "}
                <span className="text-red-600">{call.errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
