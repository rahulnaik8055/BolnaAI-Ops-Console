"use client";

import { useState } from "react";
import { LatencyBaseline } from "@/lib/types";
import { formatMs } from "@/lib/utils";
import { triggerCall } from "@/lib/api";
import ConnectionIndicator from "./ConnectionIndicator";
import { Phone, X, Loader2 } from "lucide-react";

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
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-xl px-4 sm:px-5 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight truncate">Bolna Ops</h1>
          <p className="text-[10px] text-slate-400 truncate hidden sm:block">Voice Infrastructure</p>
        </div>
        <div className="hidden md:flex items-center gap-3 ml-1">
          <ConnectionIndicator connected={connected} />
          {latency && latency.sampleSize > 0 && (
            <div className="flex items-center gap-1 rounded-md border border-border bg-slate-50 px-2 py-0.5">
              <span className="text-[10px] text-slate-400 font-mono">p50</span>
              <span className="text-[10px] font-semibold text-blue-600 font-mono tabular-nums">{formatMs(latency.p50TimeToFirstAudio)}</span>
              <span className="text-slate-300 mx-0.5">&middot;</span>
              <span className="text-[10px] text-slate-400 font-mono">p95</span>
              <span className="text-[10px] font-semibold text-amber-600 font-mono tabular-nums">{formatMs(latency.p95TimeToFirstAudio)}</span>
              <span className="text-[9px] text-slate-400 font-mono">({latency.sampleSize})</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="md:hidden"><ConnectionIndicator connected={connected} /></div>
        <div className="relative">
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="absolute right-0 top-full mt-1.5 flex flex-col gap-1.5 rounded-lg border border-border bg-white p-2.5 shadow-lg z-50 w-56"
            >
              <input type="text" value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="Agent ID" required
                className="rounded border border-border bg-slate-50 px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 font-mono" />
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+14155550142" required
                className="rounded border border-border bg-slate-50 px-2 py-1 text-[11px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 font-mono" />
              <div className="flex items-center gap-1.5">
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Phone className="h-3 w-3" />}
                  Trigger
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded p-1 hover:bg-slate-100 text-slate-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {result && <span className={`text-[10px] font-mono ${result.ok ? "text-emerald-600" : "text-red-600"}`}>{result.msg}</span>}
            </form>
          )}
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700 transition-colors">
            <Phone className="h-3 w-3" />
            <span className="hidden sm:inline">Test Call</span>
          </button>
        </div>
      </div>
    </header>
  );
}
