"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableSummary({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide" : "Summary"}
      </button>
      {expanded && (
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{summary}</p>
      )}
    </div>
  );
}
