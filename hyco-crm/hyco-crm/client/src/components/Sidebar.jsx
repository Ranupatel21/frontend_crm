import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ListChecks,
  CalendarClock,
  MessageCircle,
  UserCog,
  Sparkles,
  PhoneCall,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/leads", label: "Leads", icon: ListChecks },
  { to: "/calls", label: "My Calls", icon: PhoneCall },
  { to: "/followups", label: "Follow-ups", icon: CalendarClock },
  { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/users", label: "Team", icon: UserCog, roles: ["super_admin"] },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user } = useAuth();

  const navigation = (
    <>
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV
          .filter(
            (item) =>
              !item.roles || item.roles.includes(user?.role)
          )
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen?.(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white border-l-2 border-amber pl-[10px]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="mx-3 mb-5 rounded-lg bg-white/5 p-3.5">
        <div className="flex items-center gap-2 text-amber text-xs font-semibold mb-1">
          <Sparkles size={14} />
          Product
        </div>

        <p className="text-xs text-white/60 leading-relaxed">
          HYCO Fabric Whitener — the only product line tracked in this CRM.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-navy text-white/90 h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center text-navy-dark font-display font-bold text-sm">
            H
          </div>

          <div>
            <p className="font-display font-bold text-white leading-none tracking-tight">
              HYCO
            </p>
            <p className="text-[11px] text-white/50 leading-none mt-0.5">
              Lead CRM
            </p>
          </div>
        </div>

        {navigation}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          w-72 max-w-[85vw] h-screen
          bg-navy text-white/90
          flex flex-col
          transform transition-transform duration-300
          md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center text-navy-dark font-display font-bold text-sm">
              H
            </div>

            <div>
              <p className="font-display font-bold text-white leading-none tracking-tight">
                HYCO
              </p>
              <p className="text-[11px] text-white/50 leading-none mt-0.5">
                Lead CRM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
          >
            <X size={19} />
          </button>
        </div>

        {navigation}
      </aside>
    </>
  );
}