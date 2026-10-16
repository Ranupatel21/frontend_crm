import React, { useState } from "react";
import Modal from "./Modal.jsx";
import api from "../api/axios.js";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";

const CRM_FIELDS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "alternativePhone", label: "Alternative Phone" },
  { key: "email", label: "Email" },
  { key: "leadSource", label: "Lead Source" },
  { key: "state", label: "State" },
  { key: "product", label: "Product" },
  { key: "quantity", label: "Quantity" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "pincode", label: "Pincode" },
  { key: "priority", label: "Priority" },
  { key: "assignedTo", label: "Assigned To (salesperson)" },
  { key: "notes", label: "Notes" },
];

const columnAliases = {
  name: ["name", "full name", "customer name"],
  phone: ["phone", "mobile", "mobile no", "mobile number", "contact", "contact number"],
  alternativePhone: ["alternative phone", "alternate phone", "other number"],
  email: ["email", "e-mail"],
  leadSource: ["source", "lead source"],
  state: ["state"],
  product: ["product"],
  quantity: ["quantity", "qty"],
  address: ["address"],
  city: ["city"],
  pincode: ["pincode", "pin code", "postal code"],
  priority: ["priority"],
  assignedTo: ["assigned to", "assignee", "salesperson", "sales person", "owner", "assigned user"],
  notes: ["notes", "note", "remarks", "comment"],
};

const buildAutoMapping = (columns = []) => Object.fromEntries(
  CRM_FIELDS.flatMap(({ key }) => {
    const match = columns.find((column) => {
      const normalized = column.trim().toLowerCase();
      return columnAliases[key]?.some((alias) => normalized === alias || normalized.includes(alias));
    });
    return match ? [[key, match]] : [];
  })
);

export default function ExcelImportModal({ open, onClose, onImported, employees }) {
  const [step, setStep] = useState(1); // 1 upload, 2 mapping, 3 result
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [mapping, setMapping] = useState({});
  const [assignTo, setAssignTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep(1); setFile(null); setSheets([]); setSelectedSheet(""); setMapping({});
    setAssignTo(""); setError(""); setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await api.post("/leads/import/preview", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSheets(res.data.sheets);
      const first = res.data.sheets[0];
      setSelectedSheet(first.sheetName);
      setMapping(buildAutoMapping(first.columns));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Could not read the Excel file");
    } finally {
      setLoading(false);
    }
  };

  const currentSheet = sheets.find((s) => s.sheetName === selectedSheet);

  const handleCommit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("sheetName", selectedSheet);
      fd.append("mapping", JSON.stringify(mapping));
      if (assignTo) fd.append("defaultAssignedTo", assignTo);
      const res = await api.post("/leads/import/commit", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data.summary);
      setStep(3);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Leads from Excel" width="max-w-xl">
      {error && <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3.5 py-2.5 mb-4">{error}</div>}

      {step === 1 && (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-xl2 py-14 cursor-pointer hover:border-navy/40 hover:bg-canvas transition-colors">
          {loading ? <Loader2 className="animate-spin text-navy" size={28} /> : <UploadCloud className="text-muted" size={28} />}
          <div className="text-center">
            <p className="text-sm font-medium text-ink">{loading ? "Reading file…" : "Click to upload a lead file"}</p>
            <p className="text-xs text-muted mt-1">.xlsx, .xls, or .csv — up to 10MB</p>
          </div>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} disabled={loading} />
        </label>
      )}

      {step === 2 && currentSheet && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">Sheet</label>
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
              value={selectedSheet}
              onChange={(e) => {
                const nextSheet = sheets.find((sheet) => sheet.sheetName === e.target.value);
                setSelectedSheet(e.target.value);
                setMapping(buildAutoMapping(nextSheet?.columns));
              }}
            >
              {sheets.map((s) => <option key={s.sheetName} value={s.sheetName}>{s.sheetName} ({s.rowCount} rows)</option>)}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-ink mb-1">Map columns to CRM fields</p>
            <p className="text-xs text-muted mb-2">For “Assigned To”, use an active sales employee’s exact name or email. It takes priority over the default assignee below.</p>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {CRM_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted mb-1 block">{f.label}</label>
                  <select
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200"
                    value={mapping[f.key] || ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                  >
                    <option value="">— Skip —</option>
                    {currentSheet.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">Assign all imported leads to (optional)</label>
            <select className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <option value="">Leave unassigned</option>
              {employees?.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>

          {currentSheet.preview?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink mb-2">Data preview <span className="font-normal text-muted">(first {currentSheet.preview.length} rows)</span></p>
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-canvas text-muted">
                    <tr>{currentSheet.columns.map((column) => <th key={column} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {currentSheet.preview.map((row, index) => (
                      <tr key={index} className="border-t border-slate-100">
                        {currentSheet.columns.map((column) => <td key={column} className="px-2 py-1.5 whitespace-nowrap text-ink">{String(row[column] ?? "—")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-muted hover:text-ink">Back</button>
            <button onClick={handleCommit} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Import Leads
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="text-center py-4">
          <CheckCircle2 className="mx-auto text-success" size={40} />
          <h3 className="font-display font-semibold text-ink mt-3">Import complete</h3>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-canvas rounded-lg py-3"><p className="text-xl font-bold text-ink">{result.created}</p><p className="text-xs text-muted">Created</p></div>
            <div className="bg-canvas rounded-lg py-3"><p className="text-xl font-bold text-ink">{result.skippedDuplicates}</p><p className="text-xs text-muted">Duplicates</p></div>
            <div className="bg-canvas rounded-lg py-3"><p className="text-xl font-bold text-ink">{result.failed}</p><p className="text-xs text-muted">Failed</p></div>
          </div>
          {result.unmatchedAssignees > 0 && <p className="mt-4 text-xs text-amber-700">{result.unmatchedAssignees} row(s) had an unknown salesperson and used the default assignment (or remained unassigned).</p>}
          <button onClick={handleClose} className="mt-6 px-5 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light">Done</button>
        </div>
      )}
    </Modal>
  );
}
