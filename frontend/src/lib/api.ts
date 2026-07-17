import {
  CallExecution,
  CallStats,
  LatencyBaseline,
  AnomalyEntry,
} from "./types";

const API_BASE = "https://bolnaai-ops-console.onrender.com";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export const fetchCalls = () => get<CallExecution[]>("/calls");
export const fetchStats = () => get<CallStats>("/calls/stats");
export const fetchLatencyStats = () =>
  get<LatencyBaseline>("/calls/latency-stats");
export const fetchAnomalies = () => get<AnomalyEntry[]>("/calls/anomalies");

export async function triggerCall(
  agentId: string,
  recipientPhoneNumber: string,
) {
  const res = await fetch(`${API_BASE}/calls/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, recipientPhoneNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to trigger call");
  }
  return res.json();
}
