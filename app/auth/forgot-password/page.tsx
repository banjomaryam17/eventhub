"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]               = useState("");
  const [submitted, setSubmitted]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/auth/forgot-password/status?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.temp_password) {
        setTempPassword(data.temp_password);
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.12),_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your email and an admin will reset it for you</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {submitted ? (
            <div className="text-center flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Request submitted!</h2>

              {tempPassword ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Your temporary password:</p>
                  <p className="text-lg font-mono font-bold text-emerald-400">{tempPassword}</p>
                  <p className="text-xs text-slate-500 mt-2">Use this to log in, then change your password.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">
                    Waiting for admin to reset your password... this page will update automatically.
                  </p>
                </div>
              )}

              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 text-sm transition-colors"
              >
                {loading ? "Submitting..." : "Request password reset"}
              </button>

              <p className="text-center text-sm text-slate-400">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}