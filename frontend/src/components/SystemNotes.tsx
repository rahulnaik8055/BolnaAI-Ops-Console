"use client";

import { AlertTriangle, Gauge, Zap, DollarSign } from "lucide-react";

const sections = [
  {
    icon: DollarSign,
    title: "How Cost Is Estimated",
    content: "The total cost shown for each call is computed from the individual components received from Bolna webhooks.",
    formula: "Total Cost = LLM + Speech-to-Text + Text-to-Speech + Platform + Network",
    details: [
      "Average Cost per Call = Total Spend / Completed Calls",
      "Projected Monthly Burn = Average Daily Spend x 30",
      "Calculations are based on processed webhook events and update automatically as new calls complete.",
    ],
  },
  {
    icon: Gauge,
    title: "Latency Baseline",
    content: "Latency health is measured using Time To First Audio (TTFA).",
    details: [
      "P50 TTFA: Median latency across recent calls.",
      "P95 TTFA: 95th percentile latency used as the operational threshold.",
      "Baseline is calculated from the most recent sample of completed calls and automatically refreshes after additional webhook events.",
      "Calls exceeding the current P95 threshold are highlighted as potential latency regressions.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "How Anomalies Are Detected",
    content: "Anomalies are computed during webhook ingestion and immediately broadcast through WebSocket events.",
    badges: [
      { name: "HIGH_LATENCY", desc: "Triggered when Time To First Audio > Current P95 Baseline. Only after enough samples exist." },
      { name: "COST_OUTLIER", desc: "Triggered when Total Cost > Mean Cost + (2 x Standard Deviation)." },
      { name: "FAILED_HANGUP", desc: "Triggered when call status is: busy, failed, cancelled, stopped, error, balance-low." },
      { name: "LOW_CONFIDENCE_EXTRACTION", desc: "Triggered when extracted structured data contains mostly empty or null values." },
    ],
  },
];

export default function SystemNotes() {
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.title} className="rounded-lg border border-border bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <section.icon className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-900">{section.title}</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{section.content}</p>
          {section.formula && (
            <div className="rounded bg-slate-50 border border-border px-2.5 py-1.5 mb-2">
              <code className="text-[11px] font-mono text-blue-600">{section.formula}</code>
            </div>
          )}
          {section.details && (
            <ul className="space-y-1">
              {section.details.map((d, i) => (
                <li key={i} className="text-[11px] text-slate-500 leading-relaxed flex gap-1.5">
                  <span className="text-slate-300 shrink-0">&bull;</span>{d}
                </li>
              ))}
            </ul>
          )}
          {section.badges && (
            <div className="space-y-1.5 mt-1.5">
              {section.badges.map((b) => (
                <div key={b.name} className="rounded border border-border bg-slate-50 px-2.5 py-1.5">
                  <span className="text-[10px] font-bold font-mono text-amber-600">{b.name}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
