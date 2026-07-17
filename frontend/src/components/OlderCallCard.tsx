"use client";

import { CallExecution } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import MetricPill from "./MetricPill";
import { formatMs, formatCost, formatDuration, formatTimestamp, shortId, timeAgo } from "@/lib/utils";
import { Phone, ArrowRight, AlertCircle } from "lucide-react";

export default function OlderCallCard({
  call,
  p95,
  expanded,
  onToggle,
  mode = "card",
}: {
  call: CallExecution;
  p95: number | null;
  expanded?: boolean;
  onToggle?: () => void;
  mode?: "row" | "card";
}) {
  const highLatency = call.timeToFirstAudio != null && p95 != null && call.timeToFirstAudio > p95;

  if (mode === "row") {
    return (
      <>
        <tr id={`call-${call.id}`} onClick={onToggle}
          className="border-b border-border hover:bg-slate-50 cursor-pointer transition-colors">
          <td className="py-1.5 px-2"><StatusBadge status={call.status} /></td>
          <td className="py-1.5 px-2 text-[10px] font-mono text-slate-400 tabular-nums">{formatTimestamp(call.createdAt)}</td>
          <td className="py-1.5 px-2 text-[10px] font-mono text-slate-500">{shortId(call.id)}</td>
          <td className="py-1.5 px-2 text-[10px] font-mono text-slate-500">{call.fromNumber || call.userNumber || "--"}</td>
          <td className="py-1.5 px-2 text-[10px] font-mono text-slate-500">{call.toNumber || call.agentNumber || "--"}</td>
          <td className={`py-1.5 px-2 text-[10px] font-mono tabular-nums text-right ${highLatency ? "text-red-600 font-semibold" : "text-slate-700"}`}>
            {formatMs(call.timeToFirstAudio)}
          </td>
          <td className="py-1.5 px-2 text-[10px] font-mono tabular-nums text-slate-700 text-right">{formatDuration(call.conversationDuration)}</td>
          <td className="py-1.5 px-2 text-[10px] font-mono tabular-nums text-slate-700 text-right">{formatCost(call.totalCost)}</td>
          <td className="py-1.5 px-2 text-center">{call.errorMessage && <AlertCircle className="h-3 w-3 text-red-500 inline" />}</td>
        </tr>
        {expanded && call.summary && (
          <tr className="bg-slate-50/50">
            <td colSpan={9} className="px-3 py-2 text-[11px] text-slate-500 leading-relaxed">{call.summary}</td>
          </tr>
        )}
      </>
    );
  }

  return (
    <div id={`call-${call.id}`} className="rounded-lg border border-border bg-white p-2.5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={call.status} />
          {call.errorMessage && <span className="flex items-center gap-0.5 text-[9px] text-red-600"><AlertCircle className="h-2.5 w-2.5" />Error</span>}
        </div>
        <span className="text-[9px] font-mono text-slate-400">{timeAgo(call.createdAt)}</span>
      </div>
      <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1">
        <span className="font-mono text-slate-500">{shortId(call.id)}</span>
        <span className="text-slate-200">&middot;</span>
        <Phone className="h-2 w-2" />
        <span className="font-mono">{call.fromNumber || call.userNumber || "--"}</span>
        <ArrowRight className="h-2 w-2 text-slate-300" />
        <span className="font-mono">{call.toNumber || call.agentNumber || "--"}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {call.timeToFirstAudio != null && <MetricPill label="TTFA" value={formatMs(call.timeToFirstAudio)} danger={highLatency} />}
        {call.conversationDuration != null && <MetricPill label="Dur" value={formatDuration(call.conversationDuration)} />}
        {call.totalCost != null && call.totalCost > 0 && <MetricPill label="Cost" value={formatCost(call.totalCost)} />}
      </div>
    </div>
  );
}
