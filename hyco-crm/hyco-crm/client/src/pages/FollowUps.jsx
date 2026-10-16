import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { CheckCircle2, Clock, AlertTriangle, CalendarPlus } from "lucide-react";

const STATUS_STYLE = {
  Pending: { icon: Clock, cls: "text-amber-dark bg-amber-50" },
  Completed: { icon: CheckCircle2, cls: "text-success bg-green-50" },
  Missed: { icon: AlertTriangle, cls: "text-danger bg-red-50" },
};

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [needsScheduling, setNeedsScheduling] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await api.get("/followups", { params: filter ? { status: filter } : {} });
    setFollowUps(res.data.followUps);
    setNeedsScheduling(res.data.needsScheduling || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const complete = async (id) => {
    await api.patch(`/followups/${id}/status`, { status: "Completed" });
    fetchData();
  };

  return (
    <Layout title="Follow-ups">
      <div className="flex items-center gap-2 mb-4">
        {["Pending", "Completed", "Missed", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? "bg-navy text-white" : "bg-white border border-slate-200 text-muted hover:text-ink"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {needsScheduling.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl2 mb-4 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200">
            <CalendarPlus size={16} className="text-amber-dark" />
            <div>
              <h2 className="text-sm font-semibold text-ink">Needs follow-up scheduling</h2>
              <p className="text-xs text-muted">These leads are in the Follow Up stage but do not yet have a pending date or time.</p>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {needsScheduling.map((lead) => (
              <Link key={lead._id} to={`/leads/${lead._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-amber-100/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-ink">{lead.name || "Unnamed Lead"}</p>
                  <p className="text-xs text-muted">{lead.phone || "No phone"}{lead.assignedTo?.name ? ` · ${lead.assignedTo.name}` : ""}</p>
                </div>
                <span className="text-xs font-medium text-navy">Schedule follow-up →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="bg-white rounded-xl2 border border-slate-100 shadow-card divide-y divide-slate-50">
        {followUps.map((f) => {
          const Style = STATUS_STYLE[f.status] || STATUS_STYLE.Pending;
          const Icon = Style.icon;
          return (
            <div key={f._id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${Style.cls}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <Link to={`/leads/${f.lead?._id}`} className="text-sm font-medium text-ink hover:text-navy">{f.lead?.name || "Lead"}</Link>
                  <p className="text-xs text-muted">{f.type} · {new Date(f.followUpDate).toLocaleDateString()} {f.followUpTime} {f.assignedTo?.name ? `· ${f.assignedTo.name}` : ""}</p>
                </div>
              </div>
              {f.status === "Pending" && (
                <button onClick={() => complete(f._id)} className="text-xs font-medium text-success hover:underline">Mark done</button>
              )}
            </div>
          );
        })}
        {!loading && followUps.length === 0 && <p className="text-sm text-muted text-center py-10">No follow-ups here.</p>}
      </div>
    </Layout>
  );
}
