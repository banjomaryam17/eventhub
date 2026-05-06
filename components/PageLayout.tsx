"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  fullWidth?: boolean;
}

export default function PageLayout({
  children,
  title,
  subtitle,
  showBack = false,
  backHref,
  fullWidth = false,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {title && (
          <div className="border-b border-slate-800/60">
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${fullWidth ? "max-w-full" : "max-w-7xl"}`}>
              {showBack && (
                <Link
                  href={backHref ?? "#"}
                  onClick={!backHref ? (e) => { e.preventDefault(); window.history.back(); } : undefined}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
              )}

              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
            </div>
          </div>
        )}

        <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${fullWidth ? "max-w-full" : "max-w-7xl"}`}>
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-800/60 py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-600">© 2026 Haul.co. All rights reserved.</p><p>Contact: elliotdelaney05@gmail.com</p>
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
            <a href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}