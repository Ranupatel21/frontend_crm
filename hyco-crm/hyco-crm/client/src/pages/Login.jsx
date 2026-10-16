import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-navy-light/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-amber/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center text-navy-dark font-display font-bold">H</div>
          <div>
            <p className="text-white font-display font-bold text-lg leading-none">HYCO</p>
            <p className="text-white/50 text-xs leading-none mt-1">Lead Management CRM</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-white font-display text-4xl font-bold leading-tight">
            Every lead, one place. Every follow-up, on time.
          </h1>
          <p className="text-white/60 mt-4 text-base leading-relaxed">
            Track leads from WhatsApp, Excel and Facebook, assign them to your sales team, and
            never miss a follow-up on HYCO Fabric Whitener enquiries.
          </p>
        </div>

        <p className="relative text-white/40 text-xs">© {new Date().getFullYear()} HYCO. Internal sales tool.</p>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 bg-canvas flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center text-amber font-display font-bold">H</div>
            <p className="font-display font-bold text-ink text-lg">HYCO CRM</p>
          </div>

          <h2 className="text-2xl font-display font-bold text-ink">Welcome back</h2>
          <p className="text-muted text-sm mt-1.5">Sign in to your HYCO CRM account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hyco.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus-ring"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white font-medium text-sm py-2.5 rounded-lg hover:bg-navy-light transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          {/* <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-muted mb-2">Demo credentials (after seeding)</p>
            <ul className="text-xs text-muted space-y-1">
              <li><span className="font-medium text-ink">admin@hyco.com</span> / admin123 — Super Admin</li>
              <li><span className="font-medium text-ink">manager@hyco.com</span> / manager123 — Manager</li>
              <li><span className="font-medium text-ink">ranu@hyco.com</span> / sales123 — Sales Employee</li>
            </ul>
          </div> */}
        </div>
      </div>
    </div>
  );
}
