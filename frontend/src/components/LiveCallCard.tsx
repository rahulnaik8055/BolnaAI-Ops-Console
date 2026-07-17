"use client";

import { CallExecution } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import MetricPill from "./MetricPill";
import ExpandableSummary from "./ExpandableSummary";
import { formatMs, formatCost, formatDuration, timeAgo, shortId } from "@/lib/utils";
import { Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveCallCard({
  call,
  p95,
}: {
  call: CallExecution;
  p95: number | null;
}) {
  const highLatency = call.timeToFirstAudio != null && p95 != null && call.timeToFirstAudio > p95;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      id={`call-${call.id}`}
      className="rounded-lg border border-border bg-white p-3 hover:shadow-sm transition-shadow animate-highlight-new"
    >
      <div className="flex items-center justify-between mb-1.5">
        <StatusBadge status={call.status} />
        <span className="text-[10px] font-mono text-slate-400 tabular-nums">{timeAgo(call.createdAt)}</span>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1.5">
        <span className="font-mono text-slate-600">{shortId(call.id)}</span>
        <span className="text-slate-300">&middot;</span>
        <Phone className="h-2.5 w-2.5 text-slate-400" />
        <span className="font-mono">{call.fromNumber || call.userNumber || "--"}</span>
        <ArrowRight className="h-2.5 w-2.5 text-slate-300" />
        <span className="font-mono">{call.toNumber || call.agentNumber || "--"}</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {call.timeToFirstAudio != null && <MetricPill label="TTFA" value={formatMs(call.timeToFirstAudio)} danger={highLatency} />}
        {call.conversationDuration != null && <MetricPill label="Dur" value={formatDuration(call.conversationDuration)} />}
        {call.totalCost != null && call.totalCost > 0 && <MetricPill label="Cost" value={formatCost(call.totalCost)} />}
      </div>

      {call.summary && <ExpandableSummary summary={call.summary} />}
    </motion.div>
  );
}
