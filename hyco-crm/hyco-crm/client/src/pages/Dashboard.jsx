import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { ArrowUpRight, Phone, MessageSquare, Users, TrendingUp, Clock } from "lucide-react";

const PIE_COLORS = ["#1E2A4A", "#E8A33D", "#1F9D55", "#6D28D9", "#D64545", "#94A3B8"];

const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-2xl font-display font-bold text-ink mt-1.5">{value ?? 0}</p>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <Layout title="Dashboard">
        <div className="text-muted text-sm">Loading dashboard…</div>
      </Layout>
    );
  }

  const pipelineData = ["New", "Contacted", "Interested", "Follow Up", "Won", "Lost"].map((s) => ({
    name: s, value: data.stats[s] || 0,
  }));

  return (
    <Layout title={`Welcome, ${user?.name?.split(" ")[0]}`}>
      <div className="space-y-6">
        {/* Stat cards - role aware */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={user.role === "sales_employee" ? "My Total Leads" : "Total Leads"} value={data.stats.total} icon={Users} accent="#1E2A4A" />
          <StatCard label="Interested" value={data.stats.Interested} icon={TrendingUp} accent="#E8A33D" />
          <StatCard label="Won" value={data.stats.Won} icon={ArrowUpRight} accent="#1F9D55" />
          <StatCard label="Follow Up" value={data.stats["Follow Up"]} icon={Clock} accent="#6D28D9" />
        </div>

        {user.role === "super_admin" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Active Team Members" value={data.activeUsers} icon={Users} accent="#1E2A4A" />
            <StatCard label="Missed Calls" value={data.missedCallCount} icon={Phone} accent="#D64545" />
            <StatCard label="WhatsApp Activity" value={data.whatsappCount} icon={MessageSquare} accent="#1F9D55" />
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Pipeline chart */}
          <div className="lg:col-span-3 bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
            <h3 className="font-display font-semibold text-ink mb-4">Lead Pipeline</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#F7F8FA" }} contentStyle={{ borderRadius: 10, border: "1px solid #EEF1F4", fontSize: 13 }} />
                <Bar dataKey="value" fill="#1E2A4A" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By source / employee performance */}
          <div className="lg:col-span-2 bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
            {user.role === "super_admin" && data.bySource ? (
              <>
                <h3 className="font-display font-semibold text-ink mb-4">Lead Sources</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.bySource} dataKey="count" nameKey="_id" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {data.bySource.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #EEF1F4", fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                  {data.bySource.map((s, i) => (
                    <div key={s._id} className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {s._id} <span className="ml-auto font-medium text-ink">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display font-semibold text-ink mb-4">
                  {user.role === "manager" ? "Team Performance" : "Upcoming Follow-ups"}
                </h3>
                <div className="space-y-3">
                  {(data.byEmployee || data.upcomingFollowUps || []).slice(0, 6).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{item.name || item.lead?.name || "Lead"}</span>
                      <span className="text-muted text-xs">
                        {item.count !== undefined ? `${item.count} leads · ${item.won} won` : new Date(item.followUpDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(data.byEmployee || data.upcomingFollowUps || []).length === 0 && (
                    <p className="text-sm text-muted">Nothing to show yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent leads (sales employee) or team performance table for manager/admin */}
          {data.recentLeads && (
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-ink">My Recent Leads</h3>
                <Link to="/leads?view=my" className="text-xs text-navy font-medium hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-slate-50">
                {data.recentLeads.map((lead) => (
                  <Link key={lead._id} to={`/leads/${lead._id}`} className="flex items-center justify-between py-2.5 hover:bg-canvas -mx-2 px-2 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-ink">{lead.name || "Unnamed Lead"}</p>
                      <p className="text-xs text-muted">{lead.phone || "No phone"}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </Link>
                ))}
                {data.recentLeads.length === 0 && <p className="text-sm text-muted py-4">No leads assigned yet.</p>}
              </div>
            </div>
          )}

          {(data.upcomingFollowUps || data.byEmployee) && data.recentLeads && (
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Upcoming Follow-ups</h3>
              <div className="divide-y divide-slate-50">
                {(data.upcomingFollowUps || []).map((f) => (
                  <div key={f._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{f.lead?.name || "Lead"}</p>
                      <p className="text-xs text-muted">{f.type} · {new Date(f.followUpDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {(data.upcomingFollowUps || []).length === 0 && <p className="text-sm text-muted py-4">No pending follow-ups.</p>}
              </div>
            </div>
          )}

          {data.byEmployee && !data.recentLeads && (
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5 lg:col-span-2">
              <h3 className="font-display font-semibold text-ink mb-3">Employee-wise Performance</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-slate-100">
                    <th className="pb-2 font-medium">Employee</th>
                    <th className="pb-2 font-medium">Leads</th>
                    <th className="pb-2 font-medium">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byEmployee.map((e) => (
                    <tr key={e._id} className="border-b border-slate-50">
                      <td className="py-2.5">{e.name}</td>
                      <td className="py-2.5">{e.count}</td>
                      <td className="py-2.5 text-success font-medium">{e.won}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
