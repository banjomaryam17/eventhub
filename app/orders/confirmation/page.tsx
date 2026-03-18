"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Button, Card } from "@/components/ui";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    // Stripe appends payment_intent_client_secret and redirect_status to the URL
    const redirectStatus = searchParams.get("redirect_status");

    if (redirectStatus === "succeeded") {
      setStatus("success");
    } else if (redirectStatus === "failed") {
      setStatus("failed");
    } else {
      // No redirect status — user navigated here directly
      setStatus("success");
    }
  }, [searchParams]);

  return (
    <PageLayout>
      <div className="max-w-md mx-auto text-center py-16">
        {status === "loading" && (
          <p className="text-slate-400">Confirming your order...</p>
        )}

        {status === "success" && (
          <Card className="flex flex-col items-center gap-5">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Order confirmed!</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your payment was successful. The seller has been notified and will be in touch soon.
              </p>
            </div>

            <div className="w-full border-t border-slate-800 pt-5 flex flex-col gap-3">
              <Button href="/orders" fullWidth>
                View my orders
              </Button>
              <Button href="/listings" variant="secondary" fullWidth>
                Continue shopping
              </Button>
            </div>
          </Card>
        )}

        {status === "failed" && (
          <Card className="flex flex-col items-center gap-5">
            {/* Failure icon */}
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment failed</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Something went wrong with your payment. You have not been charged.
              </p>
            </div>

            <div className="w-full border-t border-slate-800 pt-5 flex flex-col gap-3">
              <Button href="/checkout" fullWidth>
                Try again
              </Button>
              <Button href="/cart" variant="secondary" fullWidth>
                Back to cart
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
