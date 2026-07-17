"use client";

import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-6 w-6 text-slate-300 mb-2" />
      <span className="text-xs font-medium text-slate-500">{title}</span>
      {description && <span className="text-[11px] text-slate-400 mt-0.5">{description}</span>}
    </div>
  );
}
