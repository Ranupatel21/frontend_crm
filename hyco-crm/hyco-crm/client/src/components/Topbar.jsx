import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  LogOut,
  Search,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { ROLE_LABELS } from "../utils/constants.js";

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (e) {
      /* silent */
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    fetchNotifications();
  };

  const openNotification = async (n) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n._id}/read`);
    }

    setNotifOpen(false);
    fetchNotifications();

    if (n.lead) {
      navigate(`/leads/${n.lead._id || n.lead}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 md:px-6 gap-2 sm:gap-4">

      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">

        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-muted hover:bg-canvas hover:text-ink transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-display font-semibold text-ink truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />

          <input
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                e.target.value.trim()
              ) {
                navigate(
                  `/leads?search=${encodeURIComponent(
                    e.target.value.trim()
                  )}`
                );
              }
            }}
            placeholder="Search leads by name, phone or email…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-canvas focus-ring placeholder:text-muted"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-canvas hover:text-ink transition-colors"
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-80 bg-white rounded-xl2 shadow-xl border border-slate-100 overflow-hidden">

              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold">
                  Notifications
                </p>

                <button
                  onClick={markAllRead}
                  className="text-xs text-navy hover:underline shrink-0"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="text-sm text-muted px-4 py-6 text-center">
                    You're all caught up.
                  </p>
                )}

                {notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => openNotification(n)}
                    className={`w-full text-left px-3 sm:px-4 py-3 border-b border-slate-50 hover:bg-canvas transition-colors ${
                      !n.isRead ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-amber" />
                      )}

                      <p className="text-sm font-medium text-ink truncate">
                        {n.title}
                      </p>
                    </div>

                    <p className="text-xs text-muted mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 pr-1 py-1 rounded-lg hover:bg-canvas transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{
                backgroundColor:
                  user?.avatarColor || "#1E2A4A",
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium leading-none">
                {user?.name}
              </p>

              <p className="text-[11px] text-muted leading-none mt-1">
                {ROLE_LABELS[user?.role]}
              </p>
            </div>

            <ChevronDown
              size={14}
              className="text-muted hidden sm:block"
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl2 shadow-xl border border-slate-100 py-1.5">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}