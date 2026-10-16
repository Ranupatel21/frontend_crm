
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Modal from "../components/Modal.jsx";
import api from "../api/axios.js";
import { ROLE_LABELS } from "../utils/constants.js";
import {
  Plus,
  Loader2,
  ShieldCheck,
  ShieldOff,
  UploadCloud,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "sales_employee",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetCopied, setResetCopied] = useState(false);

  // Store passwords only temporarily in frontend memory.
  const [passwords, setPasswords] = useState({});

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Could not fetch users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setCopied(false);

    const passwordUsed = form.password;
    const userName = form.name;
    const userEmail = form.email;

    try {
      const res = await api.post("/users", form);
      const created = res.data.user;

      setOpen(false);
      setForm(emptyForm);
      setShowPassword(false);

      // Keep the new password available for this session only.
      if (created?.id) {
        setPasswords((prev) => ({
          ...prev,
          [created.id]: passwordUsed,
        }));
      }

      setCreatedUser({
        id: created?.id,
        name: userName,
        email: userEmail,
        password: passwordUsed,
      });

      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create user"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u._id}/status`, {
        isActive: !u.isActive,
      });
      await fetchUsers();
    } catch (err) {
      console.error("Could not update user status:", err);
    }
  };

  const copyPassword = async () => {
    if (!createdUser?.password) return;

    try {
      await navigator.clipboard.writeText(createdUser.password);
      setCopied(true);
    } catch {
      setError("Could not copy password. Please copy it manually.");
    }
  };

  const closeCreatedUser = () => {
    setCreatedUser(null);
    setCopied(false);
    setError("");
  };

  const openResetModal = (u) => {
    setResetUser(u);
    setNewPassword("");
    setResetError("");
    setShowResetPassword(false);
    setResetCopied(false);
  };

  const closeResetModal = () => {
    setResetUser(null);
    setNewPassword("");
    setResetError("");
    setShowResetPassword(false);
    setResetCopied(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetUser || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setResetSaving(true);
    setResetError("");
    setResetCopied(false);

    try {
      await api.patch(
        `/users/${resetUser._id}/reset-password`,
        { newPassword }
      );

      // The backend hashes the password before saving.
      // Keep the new plain password in frontend memory only.
      setPasswords((prev) => ({
        ...prev,
        [resetUser._id]: newPassword,
      }));

      setVisiblePasswords((prev) => ({
        ...prev,
        [resetUser._id]: true,
      }));

      setNewPassword("");
      setResetUser(null);
    } catch (err) {
      setResetError(
        err.response?.data?.message || "Password reset failed"
      );
    } finally {
      setResetSaving(false);
    }
  };

  const copyResetPassword = async (u) => {
    const value = passwords[u._id];

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setResetCopied(true);
    } catch {
      setResetError("Could not copy password.");
    }
  };

  return (
    <Layout title="Team">
      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2 mb-4">
        <Link
          to="/leads?import=excel"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-ink hover:bg-canvas"
        >
          <UploadCloud size={15} />
          Import Excel Leads
        </Link>

        <button
          onClick={() => {
            setError("");
            setForm(emptyForm);
            setShowPassword(false);
            setOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-navy text-white hover:bg-navy-light"
        >
          <Plus size={15} />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl2 border border-slate-100 shadow-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted bg-canvas border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Password</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const password = passwords[u._id];
                const isVisible = !!visiblePasswords[u._id];

                return (
                  <tr key={u._id} className="border-b border-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <div
                          className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{
                            backgroundColor: u.avatarColor || "#1E2A4A",
                          }}
                        >
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-ink">
                          {u.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {u.email}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {isVisible && password
                            ? password
                            : "••••••••"}
                        </span>

                        {password ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePasswords((prev) => ({
                                  ...prev,
                                  [u._id]: !prev[u._id],
                                }))
                              }
                              className="text-muted hover:text-ink"
                              title={isVisible ? "Hide password" : "Show password"}
                            >
                              {isVisible ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => copyResetPassword(u)}
                              className="text-muted hover:text-ink"
                              title="Copy password"
                            >
                              <Copy size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openResetModal(u)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline whitespace-nowrap"
                            title="Set a new temporary password"
                          >
                            <KeyRound size={13} />
                            Reset
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {ROLE_LABELS[u.role] || u.role}
                    </td>

                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {u.phone || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                          u.isActive
                            ? "bg-green-50 text-success"
                            : "bg-red-50 text-danger"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(u)}
                        className="flex items-center gap-1 text-xs font-medium text-navy hover:underline ml-auto"
                      >
                        {u.isActive ? (
                          <>
                            <ShieldOff size={13} />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={13} />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setShowPassword(false);
          setError("");
        }}
        title="Add Team Member"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">
              Full Name
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus-ring"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus-ring"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">
              Temporary Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 focus-ring"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">
              Minimum 6 characters.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">
              Phone
            </label>
            <input
              type="tel"
              autoComplete="tel"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus-ring"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">
              Role
            </label>
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value }))
              }
            >
              <option value="sales_employee">Sales Employee</option>
              <option value="manager">Manager</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowPassword(false);
                setError("");
              }}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* User Created / Password Popup */}
      <Modal
        open={!!createdUser}
        onClose={closeCreatedUser}
        title="User Created Successfully"
      >
        {createdUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted">Full Name</p>
              <p className="font-medium text-ink">{createdUser.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="font-medium text-ink break-all">
                {createdUser.email}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdUser.password}
                  className="min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-canvas"
                />
                <button
                  type="button"
                  onClick={copyPassword}
                  className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-navy text-white hover:bg-navy-light"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
              Save this password securely. It is only available in this
              session and is not recoverable from the password hash.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={closeCreatedUser}
                className="px-4 py-2 text-sm font-medium text-white bg-navy rounded-lg hover:bg-navy-light"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetUser}
        onClose={closeResetModal}
        title="Reset User Password"
      >
        {resetUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-muted">
              Set a new temporary password for{" "}
              <strong>{resetUser.name}</strong>.
            </p>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                New Temporary Password
              </label>

              <div className="relative">
                <input
                  type={showResetPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200"
                />

                <button
                  type="button"
                  onClick={() => setShowResetPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-label={
                    showResetPassword ? "Hide password" : "Show password"
                  }
                >
                  {showResetPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {resetError && (
              <p className="text-sm text-danger">{resetError}</p>
            )}

            {resetCopied && (
              <p className="text-sm text-success">
                Password copied.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeResetModal}
                className="px-4 py-2 text-sm text-muted"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={resetSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-navy rounded-lg disabled:opacity-60"
              >
                {resetSaving && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                Reset Password
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
