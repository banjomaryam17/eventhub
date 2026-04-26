"use client";
export const dynamic = "force-dynamic";

import PageLayout from "@/components/PageLayout";
import Link from "next/link";

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto py-10">
        <div className="mb-10">
          <p className="text-xs text-indigo-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Terms & Conditions</h1>
          <p className="text-slate-500 text-sm">Last updated: April 2026</p>
        </div>

        <div className="flex flex-col gap-8 text-slate-400 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Haul.co, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our platform. Haul.co is a peer-to-peer marketplace for buying and selling second-hand items and is operated as an academic project by students at Dundalk Institute of Technology.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. User Accounts</h2>
            <p className="mb-2">To use Haul.co you must register for an account. You are responsible for:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Providing accurate and truthful information during registration</li>
              <li>Notifying us immediately of any unauthorised use of your account</li>
            </ul>
            <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Buying and Selling</h2>
            <p className="mb-2">Haul.co connects buyers and sellers directly. By listing or purchasing an item you agree that:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
              <li>Sellers are responsible for accurately describing their items including condition, quantity and price</li>
              <li>Sellers must own the items they list and have the right to sell them</li>
              <li>Buyers are responsible for reviewing listings carefully before purchasing</li>
              <li>All transactions are between the buyer and seller — Haul.co acts as a platform only</li>
              <li>Listing counterfeit, stolen, or prohibited items is strictly forbidden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Payments</h2>
            <p>Payments on Haul.co are processed securely through Stripe. By making a purchase you agree to Stripe's terms of service. Haul.co does not store your card details. Refunds and disputes are handled on a case-by-case basis. We reserve the right to cancel or refund orders at our discretion.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Prohibited Conduct</h2>
            <p className="mb-2">You may not use Haul.co to:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
              <li>List or sell illegal, counterfeit, or stolen goods</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Attempt to gain unauthorised access to the platform or other accounts</li>
              <li>Use the platform for any commercial spam or unsolicited communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Reviews and Reputation</h2>
            <p>Haul.co includes a review and reputation system to help build trust between users. Reviews must be honest and based on genuine transactions. Fake, malicious, or incentivised reviews are prohibited and may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>All content on Haul.co including the logo, design, and code is the property of the Haul.co development team. You may not reproduce or redistribute any part of the platform without permission. Images uploaded by users remain the property of the uploader.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>Haul.co is provided as-is for academic purposes. We make no warranties about the reliability, accuracy, or availability of the platform. We are not liable for any loss or damage arising from your use of the platform, transactions between users, or any third-party services including Stripe and Cloudinary.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of Haul.co after changes are posted constitutes your acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Contact</h2>
            <p>If you have any questions about these terms, please contact us through the platform.</p>
          </section>

        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 flex gap-6">
          <Link href="/privacy" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Privacy Policy →
          </Link>
          <Link href="/listings" className="text-sm text-slate-500 hover:text-white transition-colors">
            Back to Browse
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}