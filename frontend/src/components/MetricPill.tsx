"use client";

export default function MetricPill({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-px text-[10px] font-mono tabular-nums">
      <span className="text-text-muted">{label}</span>
      <span className={`font-semibold ${danger ? "text-red-600" : "text-text-primary"}`}>{value}</span>
    </span>
  );
}
