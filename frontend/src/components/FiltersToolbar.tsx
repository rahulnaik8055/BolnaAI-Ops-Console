"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export interface FilterState {
  search: string;
  status: string;
  highLatency: boolean;
  costOutlier: boolean;
  failures: boolean;
  sort: "newest" | "oldest";
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  status: "all",
  highLatency: false,
  costOutlier: false,
  failures: false,
  sort: "newest",
};

export function useCallFilters() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const set = (partial: Partial<FilterState>) => setFilters((f) => ({ ...f, ...partial }));
  const reset = () => setFilters(DEFAULT_FILTERS);
  const hasFilters = filters.search !== "" || filters.status !== "all" || filters.highLatency || filters.costOutlier || filters.failures;
  return { filters, set, reset, hasFilters };
}

export default function FiltersToolbar({
  filters,
  set,
  reset,
  hasFilters,
}: {
  filters: FilterState;
  set: (p: Partial<FilterState>) => void;
  reset: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="relative flex-1 min-w-[160px] max-w-[240px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search..."
          className="w-full rounded border border-border bg-white pl-6 pr-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 font-mono"
        />
        {filters.search && (
          <button onClick={() => set({ search: "" })} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <select value={filters.status} onChange={(e) => set({ status: e.target.value })}
        className="rounded border border-border bg-white px-2 py-1 text-[11px] text-slate-600 outline-none focus:border-blue-400 font-mono">
        <option value="all">All Status</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="busy">Busy</option>
      </select>

      <select value={filters.sort} onChange={(e) => set({ sort: e.target.value as "newest" | "oldest" })}
        className="rounded border border-border bg-white px-2 py-1 text-[11px] text-slate-600 outline-none focus:border-blue-400 font-mono">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>

      <div className="hidden sm:flex items-center gap-1">
        <FilterChip label="High Latency" active={filters.highLatency} onClick={() => set({ highLatency: !filters.highLatency })} />
        <FilterChip label="Cost Outlier" active={filters.costOutlier} onClick={() => set({ costOutlier: !filters.costOutlier })} />
        <FilterChip label="Failures" active={filters.failures} onClick={() => set({ failures: !filters.failures })} />
      </div>

      {hasFilters && (
        <button onClick={reset} className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors">Clear</button>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
        active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-border text-slate-400 hover:text-slate-600"
      }`}>
      {label}
    </button>
  );
}
