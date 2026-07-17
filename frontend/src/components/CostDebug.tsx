"use client";

import { useState, useEffect } from "react";
import { formatCost } from "@/lib/utils";
import { Bug, ChevronDown, ChevronRight, RefreshCw, History } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5004";

interface WebhookEventSummary {
  receivedAt: string;
  status: string;
  billingSettled: boolean | null;
  totalCost: number | null;
  costBreakdown: Record<string, number> | null;
  priceBreakdown: any;
  rawTotalCost: any;
  rawPriceBreakdown: any;
  rawCostBreakdown: any;
}

interface CostAuditRow {
  id: string;
  status: string;
  createdAt: string;
  billingSettled: boolean | null;
  webhookEventCount: number;
  rawFromLatestPayload: {
    totalCost: any;
    costBreakdown: any;
    priceBreakdown: any;
  };
  storedInDb: {
    totalCost: number | null;
    llmCost: number | null;
    synthesizerCost: number | null;
    transcriberCost: number | null;
    platformCost: number | null;
    networkCost: number | null;
    costBreakdownJson: any;
    priceBreakdown: any;
  };
  computed: {
    sumOfComponents: number | null;
    matchesStoredTotal: boolean | null;
  };
  eventHistory: WebhookEventSummary[];
}

export default function CostDebug() {
  const [data, setData] = useState<CostAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/calls/cost-audit`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("Cost audit fetch failed", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-slate-50">
          <div className="flex items-center gap-1.5">
            <Bug className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">Cost Audit</span>
            <span className="text-[9px] text-slate-400">total_cost vs price_breakdown vs dashboard</span>
          </div>
          <button onClick={fetchAudit} disabled={loading}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors disabled:opacity-50">
            <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {data.length === 0 && !loading ? (
          <div className="p-4 text-center text-xs text-slate-400">No calls recorded yet</div>
        ) : (
          <div className="divide-y divide-border">
            {data.map((row) => {
              const expanded = expandedId === row.id;
              return (
                <div key={row.id} className="hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  >
                    {expanded
                      ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                      : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                    <code className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]">{row.id.slice(0, 12)}...</code>
                    <span className="text-[10px] text-slate-400">{row.status}</span>
                    {row.billingSettled === true && (
                      <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded">SETTLED</span>
                    )}
                    {row.billingSettled === false && (
                      <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1 rounded">UNSETTLED</span>
                    )}
                    <span className="text-[9px] text-slate-400">
                      <History className="h-2.5 w-2.5 inline mr-0.5" />{row.webhookEventCount}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-slate-700 tabular-nums">
                      {formatCost(row.storedInDb.totalCost)}
                    </span>
                    {row.storedInDb.priceBreakdown != null && (
                      <span className="text-[10px] font-mono text-blue-600 tabular-nums">
                        price: {formatCost(
                          typeof row.storedInDb.priceBreakdown === "object"
                            ? row.storedInDb.priceBreakdown.total
                            : row.storedInDb.priceBreakdown
                        )}
                      </span>
                    )}
                    {row.computed.matchesStoredTotal === false && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded">MISMATCH</span>
                    )}
                  </button>

                  {expanded && (
                    <div className="px-6 pb-3 space-y-3">
                      <CostFieldComparison row={row} />
                      <EventHistory history={row.eventHistory} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CostFieldComparison({ row }: { row: CostAuditRow }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        Cost Field Comparison
      </div>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-slate-400 uppercase">
            <th className="text-left font-medium pb-1">Field</th>
            <th className="text-left font-medium pb-1">Raw Payload (latest)</th>
            <th className="text-left font-medium pb-1">DB Stored</th>
            <th className="text-left font-medium pb-1">Dashboard?</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          <tr className="border-t border-slate-100">
            <td className="py-0.5 text-slate-500">total_cost</td>
            <td className="py-0.5 text-slate-700">{JSON.stringify(row.rawFromLatestPayload.totalCost)}</td>
            <td className="py-0.5 text-slate-700">{String(row.storedInDb.totalCost)}</td>
            <td className="py-0.5 text-amber-500 text-[9px]">?</td>
          </tr>
          <tr className="border-t border-slate-100 bg-blue-50/50">
            <td className="py-0.5 text-blue-700 font-medium">price_breakdown</td>
            <td className="py-0.5 text-blue-700">{JSON.stringify(row.rawFromLatestPayload.priceBreakdown)}</td>
            <td className="py-0.5 text-blue-700">{row.storedInDb.priceBreakdown ? JSON.stringify(row.storedInDb.priceBreakdown) : "null"}</td>
            <td className="py-0.5 text-blue-600 text-[9px] font-bold">CHECK THIS</td>
          </tr>
          <CostRow label="llm" raw={row.rawFromLatestPayload.costBreakdown?.llm} stored={row.storedInDb.llmCost} />
          <CostRow label="synthesizer" raw={row.rawFromLatestPayload.costBreakdown?.synthesizer} stored={row.storedInDb.synthesizerCost} />
          <CostRow label="transcriber" raw={row.rawFromLatestPayload.costBreakdown?.transcriber} stored={row.storedInDb.transcriberCost} />
          <CostRow label="platform" raw={row.rawFromLatestPayload.costBreakdown?.platform} stored={row.storedInDb.platformCost} />
          <CostRow label="network" raw={row.rawFromLatestPayload.costBreakdown?.network} stored={row.storedInDb.networkCost} />
        </tbody>
      </table>

      {row.computed.sumOfComponents != null && (
        <div className="text-[10px] text-slate-500">
          cost_breakdown sum: <span className="font-mono text-slate-700">{formatCost(row.computed.sumOfComponents)}</span>
          {" vs "}total_cost: <span className="font-mono text-slate-700">{formatCost(row.storedInDb.totalCost)}</span>
          {row.computed.matchesStoredTotal === true && (
            <span className="ml-1 text-emerald-600 font-medium">EQUAL</span>
          )}
          {row.computed.matchesStoredTotal === false && (
            <span className="ml-1 text-red-600 font-bold">DIFFER</span>
          )}
        </div>
      )}
    </div>
  );
}

function EventHistory({ history }: { history: WebhookEventSummary[] }) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <History className="h-3 w-3" />
        Webhook Event History ({history.length} events)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-slate-400 uppercase bg-slate-50">
              <th className="text-left font-medium px-2 py-1 rounded-tl">#</th>
              <th className="text-left font-medium px-2 py-1">Status</th>
              <th className="text-left font-medium px-2 py-1">Settled</th>
              <th className="text-left font-medium px-2 py-1">total_cost</th>
              <th className="text-left font-medium px-2 py-1">price_breakdown</th>
              <th className="text-left font-medium px-2 py-1 rounded-tr">cost_breakdown</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {history.map((evt, i) => {
              const prev = i > 0 ? history[i - 1] : null;
              const totalCostChanged = prev && evt.totalCost !== prev.totalCost;
              const priceChanged = prev && JSON.stringify(evt.priceBreakdown) !== JSON.stringify(prev.priceBreakdown);

              return (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-1 text-slate-700">{evt.status}</td>
                  <td className="px-2 py-1">
                    {evt.billingSettled === true && <span className="text-emerald-600">Y</span>}
                    {evt.billingSettled === false && <span className="text-amber-600">N</span>}
                    {evt.billingSettled == null && <span className="text-slate-300">-</span>}
                  </td>
                  <td className={`px-2 py-1 ${totalCostChanged ? "text-red-600 font-bold bg-red-50" : "text-slate-700"}`}>
                    {String(evt.totalCost ?? evt.rawTotalCost ?? "null")}
                    {totalCostChanged && " ←"}
                  </td>
                  <td className={`px-2 py-1 ${priceChanged ? "text-blue-600 font-bold bg-blue-50" : "text-slate-700"}`}>
                    {evt.priceBreakdown != null ? JSON.stringify(evt.priceBreakdown) : (evt.rawPriceBreakdown != null ? JSON.stringify(evt.rawPriceBreakdown) : "null")}
                    {priceChanged && " ←"}
                  </td>
                  <td className="px-2 py-1 text-slate-600 max-w-[200px] truncate">
                    {evt.costBreakdown != null ? JSON.stringify(evt.costBreakdown) : (evt.rawCostBreakdown != null ? JSON.stringify(evt.rawCostBreakdown) : "null")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CostRow({ label, raw, stored }: { label: string; raw: any; stored: number | null }) {
  const rawStr = raw != null ? String(raw) : "null";
  const storedStr = stored != null ? String(stored) : "null";
  const differs = raw != null && stored != null && Math.abs(Number(raw) - stored) > 0.0001;

  return (
    <tr className="border-t border-slate-100">
      <td className="py-0.5 text-slate-500">{label}</td>
      <td className="py-0.5 text-slate-700">{rawStr}</td>
      <td className={`py-0.5 ${differs ? "text-red-600 font-bold" : "text-slate-700"}`}>{storedStr}</td>
      <td className="py-0.5 text-slate-400 text-[9px]">see cost_breakdown</td>
    </tr>
  );
}
