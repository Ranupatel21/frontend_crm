import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import CreateLeadModal from "../components/CreateLeadModal.jsx";
import ExcelImportModal from "../components/ExcelImportModal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { INDIAN_STATES, LEAD_SOURCES, LEAD_STATUSES, PRIORITIES } from "../utils/constants.js";
import { Plus, Search, UploadCloud, SlidersHorizontal, ChevronLeft, ChevronRight, X, Phone, MessageCircle } from "lucide-react";

const selCls = "px-2.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus-ring";

export default function Leads() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(() => params.get("import") === "excel");
  const [editingLead, setEditingLead] = useState(null);
  const [searchInput, setSearchInput] = useState(params.get("search") || "");

  const view = params.get("view") || "active";
  const canManage = user.role !== "sales_employee";

  const filters = useMemo(() => ({
    search: params.get("search") || undefined,
    status: params.get("status") || undefined,
    leadSource: params.get("leadSource") || undefined,
    state: params.get("state") || undefined,
    priority: params.get("priority") || undefined,
    assignedTo: params.get("assignedTo") || undefined,
    view,
    page: params.get("page") || 1,
  }), [params, view]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get("/leads", { params: { ...filters, limit: 20 } });
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [params]);
  useEffect(() => {
    if (params.get("import") === "excel" && canManage) setImportOpen(true);
  }, [params, canManage]);
  useEffect(() => {
    api.get("/users", { params: { isActive: true } }).then((res) => setEmployees(res.data.users));
  }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setParams(next);
  };

  const setView = (v) => {
    const next = new URLSearchParams(params);
    next.set("view", v);
    next.delete("page");
    setParams(next);
  };

  const clearFilters = () => setParams(new URLSearchParams({ view }));

  const quickAssign = async (leadId, assignedTo) => {
    await api.patch(`/leads/${leadId}/assign`, { assignedTo });
    fetchLeads();
  };

  const quickStatus = async (leadId, status) => {
    await api.patch(`/leads/${leadId}/status`, { status });
    fetchLeads();
  };
  const openWhatsApp = async (lead) => {
  try {
    const res = await api.post(
      `/whatsapp/leads/${lead._id}/conversation`
    );

    const conversation =
      res.data.conversation;

    navigate(
      `/whatsapp?conversation=${conversation._id}`
    );
  } catch (error) {
    console.error(
      "[Leads] Open WhatsApp failed:",
      error.response?.data || error
    );

    const data = error.response?.data;

    if (
      data?.code === "WHATSAPP_NOT_CONNECTED"
    ) {
      alert(
        "WhatsApp not connected. Please connect your WhatsApp first."
      );
      return;
    }

    if (
      data?.message ===
      "Lead does not have a phone number"
    ) {
      alert(
        "No phone number available for this lead."
      );
      return;
    }

    if (
      error.response?.status === 403
    ) {
      alert(
        "You don't have access to this lead."
      );
      return;
    }

    alert(
      data?.message ||
        "Unable to open WhatsApp conversation."
    );
  }
};

  return (
    <Layout title="Leads">
      <div className="space-y-4">
        {/* Toolbar */}
       <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); updateParam("search", searchInput); }}
            className="relative w-full sm:flex-1 sm:min-w-[220px] sm:max-w-sm"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, phone or email…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus-ring"
            />
          </form>

        <div className="flex items-center w-full sm:w-fit overflow-x-auto bg-white border border-slate-200 rounded-lg p-1 text-sm">
            {[["active", "Active"], ["my", "My Leads"], ["all", "All"], ...(canManage ? [["unassigned", "Unassigned"]] : [])].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
               className={`px-3 py-1.5 shrink-0 rounded-md font-medium transition-colors ${view === v ? "bg-navy text-white" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-ink hover:bg-canvas"}`}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
<div className="flex w-full sm:w-auto sm:ml-auto items-center gap-2">
            {canManage && (
              <button onClick={() => setImportOpen(true)} className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-ink hover:bg-canvas transition-colors">
                <UploadCloud size={15} /> Import Excel
              </button>
            )}
            <button onClick={() => { setEditingLead(null); setCreateOpen(true); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-navy text-white hover:bg-navy-light transition-colors">
              <Plus size={15} /> Create Lead
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-100 rounded-xl2 p-3">
            <select className={selCls} value={params.get("status") || ""} onChange={(e) => updateParam("status", e.target.value)}>
              <option value="">Status</option>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={selCls} value={params.get("leadSource") || ""} onChange={(e) => updateParam("leadSource", e.target.value)}>
              <option value="">Lead Source</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={selCls} value={params.get("state") || ""} onChange={(e) => updateParam("state", e.target.value)}>
              <option value="">State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={selCls} value={params.get("priority") || ""} onChange={(e) => updateParam("priority", e.target.value)}>
              <option value="">Priority</option>
              {PRIORITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {canManage && (
              <select className={selCls} value={params.get("assignedTo") || ""} onChange={(e) => updateParam("assignedTo", e.target.value)}>
                <option value="">Assigned To</option>
                {employees.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            )}
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted hover:text-danger ml-1">
              <X size={13} /> Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl2 border border-slate-100 shadow-card overflow-hidden">
  <div className="w-full overflow-x-auto">
    <table className="min-w-[950px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted bg-canvas border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">State / City</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className="border-b border-slate-50 hover:bg-canvas/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/leads/${lead._id}`} className="font-medium text-ink hover:text-navy">{lead.name || "Unnamed Lead"}</Link>
                      <p className="text-xs text-muted mt-0.5">{lead.phone || "No phone on file"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{lead.leadSource}</td>
                    <td className="px-4 py-3 text-muted">{[lead.city, lead.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => quickStatus(lead._id, e.target.value)}
                        className="text-xs border-0 bg-transparent focus-ring rounded cursor-pointer"
                      >
                        {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={lead.assignedTo?._id || ""}
                          onChange={(e) => quickAssign(lead._id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {employees.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-muted">{lead.assignedTo?.name || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {lead.phone && (
  <a
    href={`tel:${lead.phone}`}
    className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-slate-100 hover:text-ink"
    title="Call"
  >
    <Phone size={14} />
  </a>
)}
                     {lead.phone && (
  <button
    type="button"
    onClick={() => openWhatsApp(lead)}
    className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:bg-slate-100 hover:text-success"
    title="Open WhatsApp"
  >
    <MessageCircle size={14} />
  </button>
)}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && leads.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted text-sm">No leads found. Try adjusting filters or create a new lead.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-muted">
            <span>{pagination.total} leads found</span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateParam("page", String(pagination.page - 1))}
                className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-canvas"
              ><ChevronLeft size={15} /></button>
              <span className="text-xs">Page {pagination.page} of {pagination.totalPages || 1}</span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateParam("page", String(pagination.page + 1))}
                className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center disabled:opacity-40 hover:bg-canvas"
              ><ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
      </div>

      <CreateLeadModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchLeads}
        employees={employees}
        editingLead={editingLead}
      />
      <ExcelImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          if (params.get("import") === "excel") updateParam("import", "");
        }}
        onImported={fetchLeads}
        employees={employees}
      />
    </Layout>
  );
}
