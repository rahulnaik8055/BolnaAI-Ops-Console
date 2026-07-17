"use client";

import { getStatusColor } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const sc = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-medium ${sc.bg} ${sc.text} ${sc.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${sc.pulse ? "animate-pulse-green" : ""}`} />
      {status}
    </span>
  );
}
