"use client";

import { CallStats } from "@/lib/types";
import { formatCost, COST_COLORS, COST_LABELS } from "@/lib/utils";
import { DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-primary p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3 w-3 ${accent}`} />
        <span className="text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <span className="text-lg font-bold font-mono text-text-primary">{value}</span>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-[10px] font-mono shadow-sm">
      <span style={{ color: d.payload.fill }}>{d.name}: </span>
      <span className="text-text-primary font-semibold">{formatCost(d.value)}</span>
    </div>
  );
}

export default function CostPanel({ stats }: { stats: CallStats | null }) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-4 space-y-3">
        <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
        <div className="h-20 rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const chartData = Object.entries(stats.costByComponent)
    .map(([key, value]) => ({
      name: COST_LABELS[key] || key,
      value,
      fill: COST_COLORS[key] || "#9ca3af",
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs font-bold text-text-primary tracking-wide">
          COST
        </span>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <StatTile
            label="Total Spend"
            value={formatCost(stats.totalSpend)}
            icon={DollarSign}
            accent="text-emerald-600"
          />
          <StatTile
            label="Avg / Call"
            value={formatCost(stats.avgCostPerCall)}
            icon={BarChart3}
            accent="text-violet-600"
          />
          <StatTile
            label="Monthly Proj."
            value={formatCost(stats.projectedMonthlyBurn)}
            icon={TrendingUp}
            accent="text-amber-600"
          />
        </div>

        {chartData.length > 0 && (
          <div className="rounded-lg border border-border bg-bg-primary p-3">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-2">
              Breakdown
            </span>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
              {chartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.fill }}
                  />
                  <span className="text-[10px] text-text-secondary truncate">
                    {d.name}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted ml-auto">
                    {formatCost(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
