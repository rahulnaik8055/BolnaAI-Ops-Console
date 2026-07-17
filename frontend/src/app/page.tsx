"use client";

import { useState, useMemo } from "react";
import { useCallsSocket } from "@/hooks/useCallsSocket";
import { LIVE_STATUSES } from "@/lib/utils";
import Header from "@/components/Header";
import SummaryCards from "@/components/SummaryCards";
import LiveCallCard from "@/components/LiveCallCard";
import OlderCallCard from "@/components/OlderCallCard";
import AnomalyFeed from "@/components/AnomalyFeed";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import SystemNotes from "@/components/SystemNotes";
import CostDebug from "@/components/CostDebug";
import FiltersToolbar, { useCallFilters } from "@/components/FiltersToolbar";
import EmptyState from "@/components/EmptyState";
import { Phone, History, AlertTriangle, BarChart3, BookOpen, Bug } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "live", label: "Live Calls", icon: Phone },
  { id: "older", label: "Older Calls", icon: History },
  { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notes", label: "System Notes", icon: BookOpen },
  { id: "debug", label: "Cost Debug", icon: Bug },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const { connected, sortedCalls, stats, latency, anomalies } = useCallsSocket();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { filters, set, reset, hasFilters } = useCallFilters();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const liveCalls = useMemo(() => sortedCalls.filter((c) => LIVE_STATUSES.has(c.status)), [sortedCalls]);
  const olderCalls = useMemo(() => sortedCalls.filter((c) => !LIVE_STATUSES.has(c.status)), [sortedCalls]);
  const completedCount = useMemo(() => sortedCalls.filter((c) => c.status === "completed").length, [sortedCalls]);

  const filteredOlderCalls = useMemo(() => {
    let result = olderCalls;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) => c.id.toLowerCase().includes(q) || c.agentId?.toLowerCase().includes(q) || c.fromNumber?.includes(q) || c.toNumber?.includes(q));
    }
    if (filters.status !== "all") result = result.filter((c) => c.status === filters.status);
    if (filters.failures) result = result.filter((c) => ["no-answer", "busy", "failed", "canceled", "stopped", "error", "balance-low"].includes(c.status));
    if (filters.sort === "oldest") result = [...result].reverse();
    return result;
  }, [olderCalls, filters]);

  const filteredLiveCalls = useMemo(() => {
    let result = liveCalls;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) => c.id.toLowerCase().includes(q) || c.agentId?.toLowerCase().includes(q) || c.fromNumber?.includes(q) || c.toNumber?.includes(q));
    }
    return result;
  }, [liveCalls, filters]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header connected={connected} latency={latency} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3 space-y-3">
          <SummaryCards activeCount={liveCalls.length} completedCount={completedCount} anomalyCount={anomalies.length} stats={stats} />

          <nav className="flex items-center gap-0.5 border-b border-border -mx-4 sm:-mx-5 px-4 sm:px-5 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive ? "border-blue-600 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}>
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                  {tab.id === "live" && liveCalls.length > 0 && (
                    <span className="rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-px">{liveCalls.length}</span>
                  )}
                  {tab.id === "anomalies" && anomalies.length > 0 && (
                    <span className="rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-px">{anomalies.length}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <div key="overview" className="space-y-3 animate-slide-down">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Active Calls</h3>
                    {liveCalls.length === 0 ? (
                      <EmptyState title="No Active Calls" description="All quiet" />
                    ) : (
                      <div className="space-y-1.5">{liveCalls.slice(0, 5).map((c) => <LiveCallCard key={c.id} call={c} p95={latency?.p95TimeToFirstAudio ?? null} />)}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Latest Anomalies</h3>
                    <AnomalyFeed anomalies={anomalies.slice(0, 5)} calls={new Map(sortedCalls.map((c) => [c.id, c]))} />
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cost Overview</h3>
                  <AnalyticsPanel stats={stats} latency={latency} />
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Recent Activity</h3>
                  {sortedCalls.length === 0 ? (
                    <EmptyState title="No Calls Yet" description="Webhook events will appear here" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                      {sortedCalls.slice(0, 6).map((c) => <OlderCallCard key={c.id} call={c} p95={latency?.p95TimeToFirstAudio ?? null} mode="card" />)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "live" && (
              <div key="live" className="space-y-2 animate-slide-down">
                <FiltersToolbar filters={filters} set={set} reset={reset} hasFilters={hasFilters} />
                {filteredLiveCalls.length === 0 ? (
                  <EmptyState icon={Phone} title="No Active Calls" description="Waiting for incoming calls" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                    {filteredLiveCalls.map((c) => <LiveCallCard key={c.id} call={c} p95={latency?.p95TimeToFirstAudio ?? null} />)}
                  </div>
                )}
              </div>
            )}

            {activeTab === "older" && (
              <div key="older" className="animate-slide-down">
                <FiltersToolbar filters={filters} set={set} reset={reset} hasFilters={hasFilters} />
                {filteredOlderCalls.length === 0 ? (
                  <EmptyState icon={History} title="No Older Calls" description="Completed calls will appear here" />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block rounded-lg border border-border bg-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-border bg-slate-50">
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">From</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">To</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-right">TTFA</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-right">Duration</th>
                              <th className="py-1.5 px-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-right">Cost</th>
                              <th className="py-1.5 px-2 w-6"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOlderCalls.map((c) => (
                              <OlderCallCard key={c.id} call={c} p95={latency?.p95TimeToFirstAudio ?? null} mode="row"
                                expanded={expandedRow === c.id} onToggle={() => setExpandedRow(expandedRow === c.id ? null : c.id)} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-1.5 mt-2">
                      {filteredOlderCalls.map((c) => <OlderCallCard key={c.id} call={c} p95={latency?.p95TimeToFirstAudio ?? null} mode="card" />)}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "anomalies" && (
              <div key="anomalies" className="animate-slide-down">
                <AnomalyFeed anomalies={anomalies} calls={new Map(sortedCalls.map((c) => [c.id, c]))} />
              </div>
            )}

            {activeTab === "analytics" && (
              <div key="analytics" className="animate-slide-down">
                <AnalyticsPanel stats={stats} latency={latency} />
              </div>
            )}

            {activeTab === "notes" && (
              <div key="notes" className="animate-slide-down">
                <SystemNotes />
              </div>
            )}

            {activeTab === "debug" && (
              <div key="debug" className="animate-slide-down">
                <CostDebug />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
