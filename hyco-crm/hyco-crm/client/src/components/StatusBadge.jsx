import React from "react";
import { STATUS_COLORS } from "../utils/constants.js";

export default function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}
