"use client";

import { AnomalyEntry, CallExecution } from "@/lib/types";
import { getAnomalyColor, shortId, timeAgo } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "./EmptyState";

function AnomalyPill({ flag }: { flag: string }) {
  const label = flag.split(":")[0];
  const detail = flag.includes(":") ? flag.split(":").slice(1).join(":").trim() : null;
  const colors = getAnomalyColor(flag);
  return (
    <span title={flag} className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-px text-[9px] font-semibold font-mono ${colors.bg} ${colors.text} ${colors.border}`}>
      {label}
      {detail && <span className="font-normal opacity-60">{detail}</span>}
    </span>
  );
}

export default function AnomalyFeed({
  anomalies,
  calls,
}: {
  anomalies: AnomalyEntry[];
  calls: Map<string, CallExecution>;
}) {
  if (anomalies.length === 0) {
    return <EmptyState icon={AlertTriangle} title="System Healthy" description="No anomalies detected" />;
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {anomalies.map((entry, i) => {
          const call = calls.get(entry.callId);
          return (
            <motion.div
              key={`${entry.callId}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg border border-border bg-white p-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => {
                const el = document.getElementById(`call-${entry.callId}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-600">{shortId(entry.callId)}</span>
                  {call && <span className="text-[9px] font-mono text-slate-400 uppercase">{call.status}</span>}
                </div>
                <span className="text-[9px] font-mono text-slate-400">{entry.timestamp ? timeAgo(entry.timestamp) : "now"}</span>
              </div>
              <div className="flex flex-wrap gap-0.5">
                {entry.anomalies.map((a) => <AnomalyPill key={a} flag={a} />)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
