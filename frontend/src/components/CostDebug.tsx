"use client";

import { useState, useEffect } from "react";
import { formatCost } from "@/lib/utils";
import { Bug, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

interface CostAuditRow {
  id: string;
  status: string;
  createdAt: string;
  rawFromPayload: {
    totalCost: any;
    costBreakdown: any;
  };
  storedInDb: {
    totalCost: number | null;
    llmCost: number | null;
    synthesizerCost: number | null;
    transcriberCost: number | null;
    platformCost: number | null;
    networkCost: number | null;
    costBreakdownJson: any;
  };
  computed: {
    sumOfComponents: number | null;
    matchesStoredTotal: boolean | null;
  };
}

export default function CostDebug() {
  const [data, setData] = useState<CostAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5004"}/calls/cost-audit`);
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
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-slate-50">
        <div className="flex items-center gap-1.5">
          <Bug className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">Cost Audit</span>
          <span className="text-[9px] text-slate-400">raw vs stored vs displayed</span>
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
                  {expanded ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" /> : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                  <code className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]">{row.id.slice(0, 12)}...</code>
                  <span className="text-[10px] text-slate-400">{row.status}</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-700 tabular-nums">{formatCost(row.storedInDb.totalCost)}</span>
                  {row.computed.matchesStoredTotal === false && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded">MISMATCH</span>
                  )}
                </button>

                {expanded && (
                  <div className="px-6 pb-3 space-y-2">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="text-slate-400 uppercase">
                          <th className="text-left font-medium pb-1">Field</th>
                          <th className="text-left font-medium pb-1">Raw Payload</th>
                          <th className="text-left font-medium pb-1">DB Stored</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        <tr className="border-t border-slate-100">
                          <td className="py-0.5 text-slate-500">total_cost</td>
                          <td className="py-0.5 text-slate-700">{JSON.stringify(row.rawFromPayload.totalCost)}</td>
                          <td className="py-0.5 text-slate-700">{row.storedInDb.totalCost}</td>
                        </tr>
                        <CostRow label="llm" raw={row.rawFromPayload.costBreakdown?.llm} stored={row.storedInDb.llmCost} />
                        <CostRow label="synthesizer" raw={row.rawFromPayload.costBreakdown?.synthesizer} stored={row.storedInDb.synthesizerCost} />
                        <CostRow label="transcriber" raw={row.rawFromPayload.costBreakdown?.transcriber} stored={row.storedInDb.transcriberCost} />
                        <CostRow label="platform" raw={row.rawFromPayload.costBreakdown?.platform} stored={row.storedInDb.platformCost} />
                        <CostRow label="network" raw={row.rawFromPayload.costBreakdown?.network} stored={row.storedInDb.networkCost} />
                      </tbody>
                    </table>

                    {row.computed.sumOfComponents != null && (
                      <div className="text-[10px] text-slate-500">
                        Components sum: <span className="font-mono text-slate-700">{formatCost(row.computed.sumOfComponents)}</span>
                        {" / "}Stored total: <span className="font-mono text-slate-700">{formatCost(row.storedInDb.totalCost)}</span>
                        {row.computed.matchesStoredTotal === true && (
                          <span className="ml-1 text-emerald-600 font-medium">OK</span>
                        )}
                        {row.computed.matchesStoredTotal === false && (
                          <span className="ml-1 text-red-600 font-bold">DIFFERS</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
    </tr>
  );
}
