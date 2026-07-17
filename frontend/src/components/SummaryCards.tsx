"use client";

import { CallStats } from "@/lib/types";
import { formatCost } from "@/lib/utils";
import { Phone, CheckCircle2, AlertTriangle, DollarSign } from "lucide-react";
import { SkeletonTile } from "./SkeletonCard";

export default function SummaryCards({
  activeCount,
  completedCount,
  anomalyCount,
  stats,
}: {
  activeCount: number;
  completedCount: number;
  anomalyCount: number;
  stats: CallStats | null;
}) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)}
      </div>
    );
  }

  const cards = [
    { label: "Active", value: String(activeCount), icon: Phone, color: "text-emerald-600" },
    { label: "Completed", value: String(completedCount), icon: CheckCircle2, color: "text-blue-600" },
    { label: "Anomalies", value: String(anomalyCount), icon: AlertTriangle, color: anomalyCount > 0 ? "text-amber-600" : "text-slate-400" },
    { label: "Spend", value: formatCost(stats.totalSpend), icon: DollarSign, color: "text-slate-700" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-white p-3 flex items-center gap-3">
          <c.icon className={`h-4 w-4 ${c.color} shrink-0`} />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">{c.label}</span>
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">{c.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
