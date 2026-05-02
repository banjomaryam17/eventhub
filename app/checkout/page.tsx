"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  subtotal?: number;
  discount?: number;
  total: number;
}

interface Address {
  id: number;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

function PaymentForm({
  total,
  itemCount,
}: {
  total: number;
  itemCount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

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

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setPaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">Total</span>
          <span className="font-bold text-xl text-white">
            €{total.toFixed(2)}
          </span>
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

 function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discountCode = searchParams.get("discount") ?? "";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Ireland");

  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

useEffect(() => {
  const saved = localStorage.getItem("theme");
  if (saved === "light") setTheme("light");
}, []);
  async function fetchAddresses() {
    const res = await fetch("/api/me/addresses");

    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }

    const data = await res.json();
    const fetchedAddresses = data.addresses ?? [];

    setAddresses(fetchedAddresses);

    const defaultAddress =
      fetchedAddresses.find((a: Address) => a.is_default) ?? fetchedAddresses[0];

    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }

  async function addAddress() {
    setError("");

    const res = await fetch("/api/me/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        state: stateValue,
        postal_code: postalCode,
        country,
        is_default: addresses.length === 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to add address");
      return;
    }

    setAddresses((prev) => [data.address, ...prev]);
    setSelectedAddressId(data.address.id);

    setFullName("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setStateValue("");
    setPostalCode("");
    setCountry("Ireland");
  }

  async function initialisePayment(addressId: number) {
    setCreatingPayment(true);
    setError("");

    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_address_id: addressId, discount_code: discountCode }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        setError(checkoutData.error ?? "Failed to initialise checkout");
        return;
      }

      setClientSecret(checkoutData.clientSecret);

      setSummary((prev) =>
        prev
          ? {
              ...prev,
              total: parseFloat(checkoutData.total),
            }
          : prev
      );
    } finally {
      setCreatingPayment(false);
    }
  }

  useEffect(() => {
    async function initCheckout() {
      try {
        const cartRes = await fetch(`/api/cart${discountCode ? `?discount=${discountCode}` : ""}`);

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
        await fetchAddresses();
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [router]);

 const stripeOptions = {
  clientSecret: clientSecret ?? "",
  appearance: {
    theme: theme === "light" ? "stripe" as const : "night" as const,
    variables: {
      colorPrimary: "#6366f1",
      colorBackground: theme === "light" ? "#ffffff" : "#1e293b",
      colorText: theme === "light" ? "#0f172a" : "#f1f5f9",
      colorDanger: "#ef4444",
      borderRadius: "12px",
      fontFamily: "inherit",
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
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {loading && <LoadingSpinner message="Preparing checkout..." />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && summary && !clientSecret && (
          <>
            <Card>
              <h2 className="text-lg font-bold text-white mb-4">
                Shipping address
              </h2>

              {addresses.length > 0 && (
                <div className="flex flex-col gap-3 mb-6">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`border rounded-xl p-4 cursor-pointer ${
                        selectedAddressId === address.id
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-700 bg-slate-800/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_address"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mr-2"
                      />
                      <span className="text-white font-medium">
                        {address.full_name}
                      </span>
                      {address.is_default && (
                        <span className="ml-2 text-xs text-emerald-400">
                          Default
                        </span>
                      )}
                      <p className="text-sm text-slate-400 mt-1">
                        {address.address_line1}
                        {address.address_line2 ? `, ${address.address_line2}` : ""}
                        , {address.city}, {address.postal_code}, {address.country}
                      </p>
                    </label>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Add new address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Address line 1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Address line 2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="County / State" value={stateValue} onChange={(e) => setStateValue(e.target.value)} />
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm sm:col-span-2" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>

                <Button
                  onClick={addAddress}
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                >
                  Add address
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-white mb-4">
                Order summary
              </h2>

              <div className="flex flex-col gap-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    Items ({summary.item_count})
                  </span>
                  <span className="text-white">
                    €{summary.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping</span>
                  <span className="text-white">€4.99</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-xl text-white">
                    €{(summary.total + 4.99).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!selectedAddressId) {
                    setError("Please add or select a shipping address");
                    return;
                  }
                  initialisePayment(selectedAddressId);
                }}
                disabled={creatingPayment}
                size="lg"
                fullWidth
              >
                {creatingPayment ? "Preparing payment..." : "Continue to payment"}
              </Button>
            </Card>
          </>
        )}

        {!loading && !error && clientSecret && summary && (
          <Card>
            <h2 className="text-lg font-bold text-white mb-6">
              Payment details
            </h2>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
              <p className="text-amber-400 text-xs font-medium">
                🧪 Test mode — use card number{" "}
                <span className="font-mono">4242 4242 4242 4242</span>, any
                future date, any CVC
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
export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}