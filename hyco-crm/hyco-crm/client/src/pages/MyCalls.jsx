import React, { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Phone, Clock, MessageCircle, StickyNote, PhoneCall, Save, CheckCircle2 } from "lucide-react";

const outcomes = ["Connected", "No Answer", "Busy", "Wrong Number", "Failed"];

const formatDuration = (seconds) => {
  if (!seconds) return "No duration";
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

export default function MyCalls() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [outcome, setOutcome] = useState("Connected");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [callLaterDate, setCallLaterDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedLead = useMemo(() => leads.find((lead) => lead._id === selectedId), [leads, selectedId]);
  const selectedCalls = useMemo(() => calls.filter((call) => call.lead?._id === selectedId), [calls, selectedId]);

  const fetchData = async () => {
    const view = user?.role === "sales_employee" ? "my" : "active";
    const [leadRes, callRes] = await Promise.all([
      api.get("/leads", { params: { view, limit: 50 } }),
      api.get("/calls", { params: { limit: 100 } }),
    ]);
    setLeads(leadRes.data.leads.filter((lead) => lead.phone));
    setCalls(callRes.data.calls);
    setSelectedId((current) => current || leadRes.data.leads.find((lead) => lead.phone)?._id || "");
  };

  useEffect(() => { fetchData(); }, [user?.role]);

  const logCall = async (event) => {
    event.preventDefault();
    if (!selectedLead) return;
    setSaving(true);
    setMessage("");
    try {
      await api.post("/calls", { lead: selectedLead._id, outcome, durationSeconds, notes });
      setNotes("");
      setDurationSeconds(0);
      setMessage("Call outcome saved to lead history.");
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const scheduleCallLater = async () => {
    if (!selectedLead || !callLaterDate) return;
    setSaving(true);
    setMessage("");
    try {
      await api.post("/followups", { lead: selectedLead._id, followUpDate: callLaterDate, type: "Call", notes: "Scheduled from My Calls" });
      setCallLaterDate("");
      setMessage("Call follow-up scheduled.");
    } finally {
      setSaving(false);
    }
  };
const openWhatsApp = async () => {
  if (!selectedLead) return;

  try {
    const res = await api.post(
      `/whatsapp/leads/${selectedLead._id}/conversation`
    );

    const conversation = res.data?.conversation;

    if (!conversation?._id) {
      alert("WhatsApp conversation could not be opened.");
      return;
    }

    navigate(`/whatsapp?conversation=${conversation._id}`);
  } catch (error) {
    console.error("[MyCalls] WhatsApp error:", error);

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
    <Layout title="My Calls">
      <div className="grid lg:grid-cols-[320px_1fr] gap-5 min-h-[600px]">
        <aside className="bg-white rounded-xl2 border border-slate-100 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-display font-semibold text-ink">Call queue</h2>
            <p className="text-xs text-muted mt-0.5">{user?.role === "sales_employee" ? "Your assigned leads" : "Active leads with phone numbers"}</p>
          </div>
          <div className="max-h-[650px] overflow-y-auto divide-y divide-slate-50">
            {leads.map((lead) => (
              <button key={lead._id} onClick={() => { setSelectedId(lead._id); setMessage(""); }} className={`w-full text-left px-4 py-3 hover:bg-canvas transition-colors ${selectedId === lead._id ? "bg-canvas border-l-2 border-amber" : "border-l-2 border-transparent"}`}>
                <p className="text-sm font-semibold text-ink">{lead.name || "Unnamed Lead"}</p>
                <p className="text-xs text-muted mt-0.5">{lead.phone}</p>
                <p className="text-xs mt-1 text-muted">{lead.status} · {lead.priority} priority</p>
              </button>
            ))}
            {leads.length === 0 && <p className="text-sm text-muted text-center py-10">No callable leads found.</p>}
          </div>
        </aside>

        <section className="space-y-4">
          {!selectedLead ? <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-8 text-sm text-muted">Select a lead from the call queue.</div> : <>
            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/leads/${selectedLead._id}`} className="text-xl font-display font-bold text-ink hover:text-navy">{selectedLead.name || "Unnamed Lead"}</Link>
                  <p className="text-sm text-muted mt-1">{selectedLead.phone} · {selectedLead.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light"><Phone size={15} /> Call</a>
<button
  type="button"
  onClick={openWhatsApp}
  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-ink bg-white border border-slate-200 rounded-lg hover:bg-canvas"
>
  <MessageCircle size={15} />
  WhatsApp
</button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-medium text-muted mb-1.5 block"><Clock size={13} className="inline mr-1" />Call later</label>
                  <div className="flex gap-2"><input type="date" value={callLaterDate} onChange={(event) => setCallLaterDate(event.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200" /><button onClick={scheduleCallLater} disabled={!callLaterDate || saving} className="px-3 text-sm font-medium rounded-lg bg-canvas text-navy hover:bg-slate-100 disabled:opacity-50">Schedule</button></div>
                </div>
                <div className="text-xs text-muted flex items-end pb-1">Scheduling creates a pending Call follow-up for this lead.</div>
              </div>
            </div>

            <form onSubmit={logCall} className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4"><PhoneCall size={17} className="text-navy" /><h2 className="font-display font-semibold text-ink">Log call result</h2></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200">{outcomes.map((item) => <option key={item}>{item}</option>)}</select>
                <input type="number" min="0" value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)} placeholder="Duration (seconds)" className="px-3 py-2 text-sm rounded-lg border border-slate-200" />
                <button disabled={saving} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light disabled:opacity-60"><Save size={14} /> Save call</button>
              </div>
              <div className="mt-3"><label className="text-xs text-muted mb-1 block"><StickyNote size={13} className="inline mr-1" />Feedback / note</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="What happened on this call?" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none" /></div>
              {message && <p className="mt-3 flex items-center gap-1.5 text-xs text-success"><CheckCircle2 size={14} />{message}</p>}
            </form>

            <div className="bg-white rounded-xl2 border border-slate-100 shadow-card p-5">
              <h2 className="font-display font-semibold text-ink mb-3">My call history for this lead</h2>
              <div className="divide-y divide-slate-50">
                {selectedCalls.map((call) => <div key={call._id} className="py-3 flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-ink">{call.outcome} <span className="font-normal text-muted">· {formatDuration(call.durationSeconds)}</span></p>{call.notes && <p className="text-xs text-muted mt-0.5">{call.notes}</p>}</div><p className="text-xs text-muted whitespace-nowrap">{new Date(call.createdAt).toLocaleString()}</p></div>)}
                {selectedCalls.length === 0 && <p className="text-sm text-muted py-4">No calls logged by you for this lead yet.</p>}
              </div>
            </div>
          </>}
        </section>
      </div>
    </Layout>
  );
}
