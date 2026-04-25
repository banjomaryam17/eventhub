export const dynamic = "force-dynamic";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Button, Card, LoadingSpinner } from "@/components/ui";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartSummary {
  item_count: number;
  total: number;
}

//Payment Form (inside Stripe Elements provider)
function PaymentForm({ total, itemCount }: { total: number; itemCount: number }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();

  const [paying, setPaying]   = useState(false);
  const [error, setError]     = useState("");

  async function handlePay() {
    if (!stripe || !elements) return;

    setPaying(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/confirmation`,
      },
    });

    // confirmPayment redirects on success so we only reach here on error
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setPaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stripe payment fields */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Order summary inside form */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">Total</span>
          <span className="font-bold text-xl text-white">€{total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={handlePay}
        disabled={paying || !stripe}
        size="lg"
        fullWidth
      >
        {paying ? "Processing payment..." : `Pay €${total.toFixed(2)}`}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Payments are secured by Stripe. Your card details never touch our servers.
      </p>
    </div>
  );
}

//Main Checkout Page 
export default function CheckoutPage() {
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [summary, setSummary]           = useState<CartSummary | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    async function initCheckout() {
      try {
        // First check cart has items
        const cartRes = await fetch("/api/cart");
        if (cartRes.status === 401) {
          router.push("/auth/login");
          return;
        }

        const cartData = await cartRes.json();

        if (!cartData.items || cartData.items.length === 0) {
          router.push("/cart");
          return;
        }

        setSummary(cartData.summary);

        // Create Stripe Payment Intent
        const checkoutRes = await fetch("/api/checkout", { method: "POST" });
        const checkoutData = await checkoutRes.json();

        if (!checkoutRes.ok) {
          setError(checkoutData.error ?? "Failed to initialise checkout");
          return;
        }

        setClientSecret(checkoutData.clientSecret);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, []);

  const stripeOptions = {
    clientSecret: clientSecret ?? "",
    appearance: {
      theme: "night" as const,
      variables: {
        colorPrimary:    "#6366f1",
        colorBackground: "#1e293b",
        colorText:       "#f1f5f9",
        colorDanger:     "#ef4444",
        borderRadius:    "12px",
        fontFamily:      "inherit",
      },
    },
  };

  return (
    <PageLayout
      title="Checkout"
      subtitle="Complete your purchase securely"
      showBack
      backHref="/cart"
    >
      <div className="max-w-lg mx-auto">
        {loading && <LoadingSpinner message="Preparing checkout..." />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {error}
            <div className="mt-3">
              <Button href="/cart" variant="secondary" size="sm">
                Back to cart
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && clientSecret && summary && (
          <Card>
            <h2 className="text-lg font-bold text-white mb-6">Payment details</h2>

            {/* Test mode notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
              <p className="text-amber-400 text-xs font-medium">
                🧪 Test mode — use card number <span className="font-mono">4242 4242 4242 4242</span>, any future date, any CVC
              </p>
            </div>

            <Elements stripe={stripePromise} options={stripeOptions}>
              <PaymentForm
                total={summary.total}
                itemCount={summary.item_count}
              />
            </Elements>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
