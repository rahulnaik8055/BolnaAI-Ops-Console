"use client";

import { CallStats, LatencyBaseline } from "@/lib/types";
import { formatCost, formatMs, COST_COLORS, COST_LABELS } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DollarSign, BarChart3, TrendingUp } from "lucide-react";

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded border border-border bg-white px-2 py-1 text-[10px] font-mono shadow-md">
      <span style={{ color: d.payload.fill }}>{d.name}: </span>
      <span className="text-slate-900 font-semibold">{formatCost(d.value)}</span>
    </div>
  );
}

export default function AnalyticsPanel({
  stats,
  latency,
}: {
  stats: CallStats | null;
  latency: LatencyBaseline | null;
}) {
  if (!stats && !latency) {
    return <div className="text-center py-12 text-slate-400 text-xs">No data available</div>;
  }

  const chartData = stats
    ? Object.entries(stats.costByComponent)
        .map(([key, value]) => ({ name: COST_LABELS[key] || key, value, fill: COST_COLORS[key] || "#94a3b8" }))
        .filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-3">
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <StatTile label="Total Spend" value={formatCost(stats.totalSpend)} icon={DollarSign} />
          <StatTile label="Avg / Call" value={formatCost(stats.avgCostPerCall)} icon={BarChart3} />
          <StatTile label="Monthly Proj." value={formatCost(stats.projectedMonthlyBurn)} icon={TrendingUp} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {chartData.length > 0 && (
          <div className="rounded-lg border border-border bg-white p-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">Cost Breakdown</span>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2">
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-[9px] text-slate-500 truncate">{d.name}</span>
                  <span className="text-[9px] font-mono text-slate-400 ml-auto tabular-nums">{formatCost(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {latency && latency.sampleSize > 0 && (
          <div className="rounded-lg border border-border bg-white p-3">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">Latency Baseline</span>
            <div className="space-y-2">
              <LatencyRow label="P50 TTFA" value={formatMs(latency.p50TimeToFirstAudio)} />
              <LatencyRow label="P95 TTFA" value={formatMs(latency.p95TimeToFirstAudio)} danger />
              <LatencyRow label="Mean Cost" value={formatCost(latency.meanCost)} />
              <LatencyRow label="Std Dev" value={formatCost(latency.stdDevCost)} />
              <div className="pt-1.5 border-t border-border">
                <span className="text-[9px] text-slate-400">Based on {latency.sampleSize} samples</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

function LatencyRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs font-mono font-semibold tabular-nums ${danger ? "text-amber-600" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
