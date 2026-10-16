import React, { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import api from "../api/axios.js";
import { INDIAN_STATES, LEAD_SOURCES, PRIORITIES, PRODUCTS } from "../utils/constants.js";
import { Loader2 } from "lucide-react";

const emptyForm = {
  name: "", phone: "", alternativePhone: "", email: "", leadSource: "Other",
  state: "", product: "HYCO Fabric Whitener", quantity: "", address: "",
  city: "", pincode: "", priority: "Medium", assignedTo: "", notes: "",
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm font-medium text-ink mb-1.5 block">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus-ring";

export default function CreateLeadModal({ open, onClose, onCreated, employees, editingLead }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingLead) {
      setForm({ ...emptyForm, ...editingLead, assignedTo: editingLead.assignedTo?._id || editingLead.assignedTo || "" });
    } else {
      setForm(emptyForm);
    }
  }, [editingLead, open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

 const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  setError("");

  try {
    const normalizeIndianPhone = (value) => {
      const digits = String(value || "").replace(/\D/g, "");

      if (!digits) return "";

      if (digits.startsWith("91") && digits.length === 12) {
        return `+${digits}`;
      }

      if (digits.length === 10) {
        return `+91${digits}`;
      }

      return value.trim();
    };

    const payload = {
      ...form,
      phone: normalizeIndianPhone(form.phone),
      alternativePhone: normalizeIndianPhone(form.alternativePhone),
      assignedTo: form.assignedTo || null,
    };

    if (editingLead) {
      await api.put(`/leads/${editingLead._id}`, payload);
    } else {
      await api.post("/leads", payload);
    }

    onCreated();
    onClose();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Something went wrong. Please try again."
    );
  } finally {
    setSaving(false);
  }
};
  return (
    <Modal open={open} onClose={onClose} title={editingLead ? "Edit Lead" : "Create Lead"} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3.5 py-2.5">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className={inputCls} value={form.name} onChange={set("name")} placeholder="Lead's full name" /></Field>
          <Field label="Phone Number">
  <input
    className={inputCls}
    value={form.phone}
    onChange={set("phone")}
    placeholder="Enter 10 digit number"
  />
</Field>

<Field label="Alternative Number">
  <input
    className={inputCls}
    value={form.alternativePhone}
    onChange={set("alternativePhone")}
    placeholder="Enter 10 digit number"
  />
</Field> 
          <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="name@example.com" /></Field>

          <Field label="Lead Source">
            <select className={inputCls} value={form.leadSource} onChange={set("leadSource")}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="State">
            <select className={inputCls} value={form.state} onChange={set("state")}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Product">
            <select className={inputCls} value={form.product} onChange={set("product")}>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Quantity"><input className={inputCls} value={form.quantity} onChange={set("quantity")} placeholder="e.g. 10 units" /></Field>

          <Field label="City"><input className={inputCls} value={form.city} onChange={set("city")} /></Field>
          <Field label="Pincode"><input className={inputCls} value={form.pincode} onChange={set("pincode")} /></Field>

          <Field label="Priority">
            <select className={inputCls} value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Assigned To">
            <select className={inputCls} value={form.assignedTo} onChange={set("assignedTo")}>
              <option value="">Unassigned</option>
              {employees?.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Address"><textarea rows={2} className={inputCls} value={form.address} onChange={set("address")} /></Field>
        <Field label="Notes"><textarea rows={2} className={inputCls} value={form.notes} onChange={set("notes")} placeholder="Any relevant context…" /></Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light transition-colors disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {editingLead ? "Save Changes" : "Create Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
