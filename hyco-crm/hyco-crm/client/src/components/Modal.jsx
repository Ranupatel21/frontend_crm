import React from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 backdrop-blur-[2px] py-10 px-4">
      <div className={`bg-white rounded-xl2 shadow-xl w-full ${width} animate-[fadeIn_.15s_ease-out]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors rounded p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
