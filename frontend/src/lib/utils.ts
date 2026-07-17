export const FAILED_STATUSES = new Set([
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
]);

export const LIVE_STATUSES = new Set(["queued", "initiated", "ringing", "in-progress"]);

export function getStatusColor(status: string) {
  if (status === "in-progress")
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", pulse: true };
  if (status === "completed")
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", pulse: false };
  if (status === "ringing")
    return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", pulse: false };
  if (["queued", "initiated"].includes(status))
    return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", pulse: false };
  if (status === "busy")
    return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", pulse: false };
  if (FAILED_STATUSES.has(status))
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", pulse: false };
  return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", pulse: false };
}

export function getAnomalyColor(flag: string) {
  if (flag.startsWith("HIGH_LATENCY")) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  if (flag.startsWith("COST_OUTLIER")) return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  if (flag.startsWith("FAILED_HANGUP")) return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  if (flag.startsWith("LOW_CONFIDENCE")) return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };
}

const costFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function formatCost(val: number | null | undefined) {
  if (val == null) return "--";
  return costFormatter.format(val);
}

export function formatMs(val: number | null | undefined) {
  if (val == null) return "--";
  return `${Math.round(val)}ms`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function shortId(id: string) {
  return id.length > 20 ? id.slice(0, 16) + "..." : id;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatTimestamp(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const COST_COLORS: Record<string, string> = {
  llm: "#3b82f6",
  synthesizer: "#8b5cf6",
  transcriber: "#22c55e",
  platform: "#f59e0b",
  network: "#ef4444",
};

export const COST_LABELS: Record<string, string> = {
  llm: "LLM",
  synthesizer: "Synth",
  transcriber: "STT",
  platform: "Platform",
  network: "Network",
};
