export const FAILED_STATUSES = new Set([
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
]);

export function getStatusColor(status: string) {
  if (["queued", "initiated", "ringing"].includes(status))
    return {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
    };
  if (status === "in-progress")
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500 animate-pulse",
      border: "border-emerald-200",
      iconBg: "bg-emerald-100",
    };
  if (status === "completed")
    return {
      bg: "bg-gray-50",
      text: "text-gray-600",
      dot: "bg-gray-400",
      border: "border-gray-200",
      iconBg: "bg-gray-100",
    };
  if (FAILED_STATUSES.has(status))
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      border: "border-red-200",
      iconBg: "bg-red-100",
    };
  return {
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
    border: "border-gray-200",
    iconBg: "bg-gray-100",
  };
}

export function getAnomalyColor(flag: string) {
  if (flag.startsWith("HIGH_LATENCY"))
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  if (flag.startsWith("COST_OUTLIER"))
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  if (flag.startsWith("FAILED_HANGUP"))
    return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
  return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
}

export function formatCost(val: number | null | undefined) {
  if (val == null) return "--";
  return `$${val.toFixed(2)}`;
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
  return id.length > 16 ? id.slice(0, 12) + "..." : id;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export const COST_COLORS: Record<string, string> = {
  llm: "#3b82f6",
  synthesizer: "#8b5cf6",
  transcriber: "#10b981",
  platform: "#f59e0b",
  network: "#ef4444",
};

export const COST_LABELS: Record<string, string> = {
  llm: "LLM",
  synthesizer: "Synth",
  transcriber: "Trans.",
  platform: "Platform",
  network: "Network",
};
