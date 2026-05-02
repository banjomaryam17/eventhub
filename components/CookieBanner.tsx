"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = document.cookie
      .split("; ")
      .find((row) => row.startsWith("haul_cookies_accepted="));
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    // Set cookie for 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `haul_cookies_accepted=true; expires=${expires.toUTCString()}; path=/`;
    setVisible(false);
  }

  function decline() {
    // Set cookie for session only
    document.cookie = `haul_cookies_accepted=false; path=/`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-1">🍪 We use cookies</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Haul.co uses cookies to keep you signed in and improve your experience.
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 text-xs rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}