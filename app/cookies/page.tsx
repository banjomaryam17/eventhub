"use client";
import { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { Card } from "@/components/ui";

export default function CookiesPage() {
  const [status, setStatus] = useState<"accepted" | "declined" | "not set">("not set");

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("haul_cookies_accepted="));
    if (!cookie) setStatus("not set");
    else if (cookie.includes("true")) setStatus("accepted");
    else setStatus("declined");
  }, []);

  function accept() {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `haul_cookies_accepted=true; expires=${expires.toUTCString()}; path=/`;
    setStatus("accepted");
  }

  function decline() {
    document.cookie = `haul_cookies_accepted=false; path=/`;
    setStatus("declined");
  }

  function reset() {
    document.cookie = `haul_cookies_accepted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    setStatus("not set");
  }

  return (
    <PageLayout title="Cookie Preferences" subtitle="Manage how Haul.co uses cookies">
      <div className="max-w-2xl flex flex-col gap-6">

        {/* Current status */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">Current status</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
            status === "accepted"
              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
              : status === "declined"
              ? "bg-red-400/10 text-red-400 border-red-400/20"
              : "bg-slate-400/10 text-slate-400 border-slate-400/20"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status === "accepted" ? "bg-emerald-400"
              : status === "declined" ? "bg-red-400"
              : "bg-slate-400"
            }`} />
            Cookies {status}
          </div>
        </Card>

        {/* What we use cookies for */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">What we use cookies for</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <p className="text-sm font-medium text-white">Essential cookies</p>
                <p className="text-xs text-slate-400 mt-0.5">Keep you signed in and secure your session. These are required for the site to function.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <p className="text-sm font-medium text-white">Preference cookies</p>
                <p className="text-xs text-slate-400 mt-0.5">Remember your settings such as dark/light mode across visits.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
              <span className="text-indigo-400 mt-0.5">ℹ</span>
              <div>
                <p className="text-sm font-medium text-white">No tracking or advertising cookies</p>
                <p className="text-xs text-slate-400 mt-0.5">Haul.co does not use third-party tracking or advertising cookies. Your data is never sold.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* GDPR rights */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">Your GDPR rights</h2>
          <div className="flex flex-col gap-2 text-sm text-slate-400">
            <p>✓ Right to access your personal data</p>
            <p>✓ Right to have your data deleted</p>
            <p>✓ Right to withdraw consent at any time</p>
            <p>✓ Right to data portability</p>
            <p className="text-xs text-slate-500 mt-2">
              For any data requests, contact us via the platform. Haul.co complies with GDPR as required under EU law.
            </p>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4">Manage preferences</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={accept}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              ✓ Accept all cookies
            </button>
            <button
              onClick={decline}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Decline non-essential
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-sm transition-colors"
            >
              🔄 Reset for demo
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Clicking "Reset for demo" clears your cookie preference so the banner appears again on next page load.
          </p>
        </Card>

      </div>
    </PageLayout>
  );
}