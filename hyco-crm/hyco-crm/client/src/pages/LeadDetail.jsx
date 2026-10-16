import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import CreateLeadModal from "../components/CreateLeadModal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { LEAD_STATUSES } from "../utils/constants.js";
import {
  ArrowLeft, Phone, MessageCircle, Mail, MapPin, Pencil, Plus,
  Clock, CheckCircle2, User as UserIcon, Package,
} from "lucide-react";

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    <Icon size={16} className="text-muted mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-ink font-medium truncate">{value || "—"}</p>
    </div>
  </div>
);

export default function LeadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState("activity");
  const [editOpen, setEditOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [fuForm, setFuForm] = useState({ followUpDate: "", followUpTime: "", type: "Call", notes: "" });
  const [showFuForm, setShowFuForm] = useState(false);
  
  const fetchAll = async () => {
    const [leadRes, actRes, fuRes] = await Promise.all([
      api.get(`/leads/${id}`),
      api.get(`/leads/${id}/activities`),
      api.get(`/followups`, { params: { lead: id } }),
    ]);
    setLead(leadRes.data.lead);
    setActivities(actRes.data.activities);
    setFollowUps(fuRes.data.followUps);
  };

  useEffect(() => { fetchAll(); }, [id]);
  useEffect(() => { api.get("/users", { params: { isActive: true } }).then((res) => setEmployees(res.data.users)); }, []);

  if (!lead) return <Layout title="Lead"><div className="text-muted text-sm">Loading lead…</div></Layout>;
 
  const canManage = user.role !== "sales_employee";

  const changeStatus = async (status) => {
    await api.patch(`/leads/${id}/status`, { status });
    fetchAll();
  };

  const changeAssignment = async (assignedTo) => {
    await api.patch(`/leads/${id}/assign`, { assignedTo });
    fetchAll();
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await api.post(`/leads/${id}/notes`, { note: noteText });
    setNoteText("");
    fetchAll();
  };

  const submitFollowUp = async (e) => {
    e.preventDefault();
    if (!fuForm.followUpDate) return;
    await api.post("/followups", { ...fuForm, lead: id });
    setFuForm({ followUpDate: "", followUpTime: "", type: "Call", notes: "" });
    setShowFuForm(false);
    fetchAll();
  };

  const completeFollowUp = async (fid) => {
    await api.patch(`/followups/${fid}/status`, { status: "Completed" });
    fetchAll();
  };
  const openWhatsApp = async (leadId) => {
  try {
    const res = await api.post(
      `/whatsapp/leads/${leadId}/conversation`
    );

    const conversation = res.data?.conversation;

    if (!conversation?._id) {
      alert("WhatsApp conversation could not be opened.");
      return;
    }

    navigate(`/whatsapp?conversation=${conversation._id}`);
  } catch (error) {
    console.error("[Leads] WhatsApp error:", error);

    const data = error.response?.data;

    if (data?.code === "WHATSAPP_NOT_CONNECTED") {
      alert("WhatsApp not connected. Please connect WhatsApp first.");
      return;
    }

    if (data?.message === "Lead does not have a phone number") {
      alert("No phone number available for this lead.");
      return;
    }

    if (error.response?.status === 403) {
      alert("You don't have access to this lead.");
      return;
    }

    alert(
      data?.message ||
      "Unable to open WhatsApp conversation."
    );
  }
};
  return (
    <Layout title="Lead Details">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4">
        <ArrowLeft size={15} /> Back to leads
      </button>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-display font-bold text-ink">{lead.name || "Unnamed Lead"}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                </div>
              </div>
              <button onClick={() => setEditOpen(true)} className="w-8 h-8 rounded-md flex items-center justify-center text-muted hover:bg-canvas hover:text-ink">
                <Pencil size={15} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4">
              {lead.phone && (
  <button
    type="button"
    onClick={() => openWhatsApp(lead._id)}
    className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-slate-100 hover:text-success"
    title="Open WhatsApp"
  >
    <MessageCircle size={14} />
  </button>
)}
              {lead.phone && (
   <button
    type="button"
    onClick={openWhatsApp}
    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-canvas text-sm font-medium text-ink hover:bg-slate-100"
  >
    <MessageCircle size={14} /> WhatsApp
  </button>
)}
            </div>

            <div className="mt-3 divide-y divide-slate-50">
              <InfoRow icon={Phone} label="Phone" value={lead.phone} />
              <InfoRow icon={Phone} label="Alternative Phone" value={lead.alternativePhone} />
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={MapPin} label="Location" value={[lead.address, lead.city, lead.state, lead.pincode].filter(Boolean).join(", ")} />
              <InfoRow icon={Package} label="Product / Quantity" value={[lead.product, lead.quantity].filter(Boolean).join(" · ")} />
              <InfoRow icon={UserIcon} label="Created By" value={lead.createdBy?.name} />
            </div>
          </div>

          <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5 space-y-4">
            <div>
              <label className="text-xs text-muted mb-1.5 block">Status</label>
              <select value={lead.status} onChange={(e) => changeStatus(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200">
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {canManage && (
              <div>
                <label className="text-xs text-muted mb-1.5 block">Assigned To</label>
                <select value={lead.assignedTo?._id || ""} onChange={(e) => changeAssignment(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200">
                  <option value="">Unassigned</option>
                  {employees.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-lg p-1 w-fit mb-4">
            {[["activity", "Activity"], ["followups", "Follow-ups"], ["notes", "Notes"]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === k ? "bg-navy text-white" : "text-muted hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "activity" && (
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Activity Timeline</h3>
              <div className="space-y-0">
                {activities.map((a, i) => (
                  <div key={a._id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-navy mt-1.5" />
                      {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-100" />}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium text-ink">{a.type}</p>
                      <p className="text-xs text-muted mt-0.5">{a.description}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()} {a.user?.name ? `· ${a.user.name}` : ""}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && <p className="text-sm text-muted">No activity recorded yet.</p>}
              </div>
            </div>
          )}

          {tab === "followups" && (
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-ink">Follow-ups</h3>
                <button onClick={() => setShowFuForm((s) => !s)} className="flex items-center gap-1.5 text-sm font-medium text-navy hover:underline">
                  <Plus size={14} /> Add Follow-up
                </button>
              </div>

              {showFuForm && (
                <form onSubmit={submitFollowUp} className="grid sm:grid-cols-4 gap-2 mb-4 bg-canvas rounded-lg p-3">
                  <input type="date" required className="px-2.5 py-1.5 text-sm rounded-md border border-slate-200" value={fuForm.followUpDate} onChange={(e) => setFuForm((f) => ({ ...f, followUpDate: e.target.value }))} />
                  <input type="time" className="px-2.5 py-1.5 text-sm rounded-md border border-slate-200" value={fuForm.followUpTime} onChange={(e) => setFuForm((f) => ({ ...f, followUpTime: e.target.value }))} />
                  <select className="px-2.5 py-1.5 text-sm rounded-md border border-slate-200" value={fuForm.type} onChange={(e) => setFuForm((f) => ({ ...f, type: e.target.value }))}>
                    {["Call", "WhatsApp", "Meeting", "Other"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-navy rounded-md hover:bg-navy-light">Save</button>
                  <input placeholder="Notes (optional)" className="sm:col-span-4 px-2.5 py-1.5 text-sm rounded-md border border-slate-200" value={fuForm.notes} onChange={(e) => setFuForm((f) => ({ ...f, notes: e.target.value }))} />
                </form>
              )}

              <div className="space-y-2">
                {followUps.map((f) => (
                  <div key={f._id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-3">
                      <Clock size={15} className="text-muted" />
                      <div>
                        <p className="text-sm font-medium text-ink">{f.type} · {new Date(f.followUpDate).toLocaleDateString()} {f.followUpTime}</p>
                        {f.notes && <p className="text-xs text-muted">{f.notes}</p>}
                      </div>
                    </div>
                    {f.status === "Pending" ? (
                      <button onClick={() => completeFollowUp(f._id)} className="flex items-center gap-1 text-xs font-medium text-success hover:underline">
                        <CheckCircle2 size={14} /> Mark done
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-success">Completed</span>
                    )}
                  </div>
                ))}
                {followUps.length === 0 && <p className="text-sm text-muted">No follow-ups scheduled.</p>}
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Notes</h3>
              <form onSubmit={submitNote} className="flex gap-2 mb-4">
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note about this lead…" className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus-ring" />
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light">Add</button>
              </form>
              <pre className="whitespace-pre-wrap text-sm text-ink font-body bg-canvas rounded-lg p-3.5 min-h-[80px]">{lead.notes || "No notes yet."}</pre>
            </div>
          )}
        </div>
      </div>

      <CreateLeadModal open={editOpen} onClose={() => setEditOpen(false)} onCreated={fetchAll} employees={employees} editingLead={lead} />
    </Layout>
  );
}
