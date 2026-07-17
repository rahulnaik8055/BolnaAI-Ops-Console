"use client";

import { useState } from "react";
import { LatencyBaseline } from "@/lib/types";
import { formatMs } from "@/lib/utils";
import { triggerCall } from "@/lib/api";
import { Activity, Phone, X, Loader2, ChevronRight } from "lucide-react";

export default function Header({
  connected,
  latency,
}: {
  connected: boolean;
  latency: LatencyBaseline | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      await triggerCall(agentId, phoneNumber);
      setResult({ ok: true, msg: "Call triggered" });
      setAgentId("");
      setPhoneNumber("");
      setTimeout(() => setResult(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setResult({ ok: false, msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 bg-bg-secondary">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold tracking-tight text-text-primary">
            BOLNA OPS
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500 animate-pulse-green" : "bg-red-400"
            }`}
          />
          <span className="text-[11px] text-text-secondary font-medium">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        {latency && latency.sampleSize > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border bg-bg-primary px-2.5 py-1">
            <span className="text-[11px] text-text-muted">p50</span>
            <span className="text-[11px] font-semibold text-amber-600 font-mono">
              {formatMs(latency.p50TimeToFirstAudio)}
            </span>
            <span className="text-[10px] text-text-muted mx-0.5">&middot;</span>
            <span className="text-[11px] text-text-muted">p95</span>
            <span className="text-[11px] font-semibold text-amber-600 font-mono">
              {formatMs(latency.p95TimeToFirstAudio)}
            </span>
            <span className="text-[10px] text-text-muted font-mono">
              ({latency.sampleSize})
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 relative">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="absolute right-full mr-3 flex items-end gap-2 rounded-lg border border-border bg-bg-card p-3 shadow-lg"
          >
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="agent_id"
                required
                className="w-36 rounded border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-500/50 font-mono"
              />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+14155550142"
                required
                className="w-36 rounded border border-border bg-bg-primary px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
                Call
              </button>
              {result && (
                <span className={`text-[10px] font-mono ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
                  {result.msg}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </form>
        )}
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Test Call</span>
        </button>
      </div>
    </header>
  );
}
