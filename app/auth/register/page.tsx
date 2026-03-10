"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirm]   = useState("");
  const [showPass, setShowPass]         = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const strength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"][strength];

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // ── Client-side validation ────────────────────────────────────────
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Username can only contain letters, numbers, or underscores.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false); 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-12">

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.12),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(20,184,166,0.08),_transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Start buying and selling today</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleRegister} className="space-y-4" noValidate>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="e.g. john_doe"
                autoComplete="username"
                maxLength={30}
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Letters, numbers, and underscores only</p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm pr-11
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : "#334155" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPass ? "text" : "password"}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={`w-full rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all
                           ${confirmPassword && confirmPassword !== password
                              ? "border-red-500/60 focus:border-red-500"
                              : confirmPassword && confirmPassword === password
                              ? "border-green-500/60 focus:border-green-500"
                              : "border-slate-700 focus:border-indigo-500"
                           }`}
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3" role="alert">
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50
                         text-white font-medium py-3 text-sm mt-2
                         transition-all duration-150 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By creating an account, you agree to our{" "}
          <a href="/terms" className="text-slate-500 hover:text-slate-400 transition-colors">Terms</a>{" "}
          &amp;{" "}
          <a href="/privacy" className="text-slate-500 hover:text-slate-400 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
