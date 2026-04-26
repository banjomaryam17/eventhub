"use client";
export const dynamic = "force-dynamic";

import PageLayout from "@/components/PageLayout";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto py-10">
        <div className="mb-10">
          <p className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: April 2026</p>
        </div>

        <div className="flex flex-col gap-8 text-slate-400 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Haul.co is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information in accordance with the General Data Protection Regulation (GDPR). Haul.co is a peer-to-peer marketplace developed as an academic project at Dundalk Institute of Technology.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. What Data We Collect</h2>
            <p className="mb-2">We may collect the following information:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
              <li>Name, email address, and contact details</li>
              <li>Account information such as username and password</li>
              <li>Billing and shipping address</li>
              <li>Transaction details (items bought and sold)</li>
              <li>Messages exchanged between users</li>
              <li>Technical data such as IP address, browser type, and usage activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <p className="mb-2">Your data is used to:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
              <li>Facilitate buying and selling on the platform</li>
              <li>Manage user accounts and provide support</li>
              <li>Enable reviews and reputation systems</li>
              <li>Detect and prevent fraud or misuse</li>
              <li>Improve platform functionality and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Legal Basis for Processing</h2>
            <p>
              Under GDPR, we process your data based on contractual necessity (to provide our services), legitimate interests (to improve and secure the platform), and legal obligations. Where required, we rely on your consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal data. However, we may share your data with trusted third parties where necessary:
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2 mt-2">
              <li>Stripe for secure payment processing</li>
              <li>Cloudinary for image storage and delivery</li>
              <li>Service providers for hosting and analytics</li>
            </ul>
            <p className="mt-2">
              These providers process data on our behalf and are required to comply with GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Cookies</h2>
            <p>
              Haul.co uses cookies to maintain sessions, store preferences, and analyse usage. You can control cookies through your browser settings, but some features may not function properly if disabled.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Data Retention</h2>
            <p>
              We retain your data only as long as necessary to provide our services, comply with legal obligations, and resolve disputes. When data is no longer required, it will be securely deleted or anonymised.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="mb-2">Under GDPR, you have the right to:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Restrict or object to processing</li>
              <li>Request data portability</li>
            </ul>
            <p className="mt-2">
              You also have the right to lodge a complaint with a Data Protection Authority.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Account Termination</h2>
            <p>
              If your account is terminated, your data will be handled in accordance with this policy and applicable legal requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use of Haul.co after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the platform.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 flex gap-6">
          <Link href="/terms" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Terms & Conditions →
          </Link>
          <Link href="/listings" className="text-sm text-slate-500 hover:text-white transition-colors">
            Back to Browse
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}