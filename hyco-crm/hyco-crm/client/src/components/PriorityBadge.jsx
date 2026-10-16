import React from "react";
import { PRIORITY_COLORS } from "../utils/constants.js";

export default function PriorityBadge({ priority }) {
  const cls = PRIORITY_COLORS[priority] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {priority}
    </span>
  );
}
