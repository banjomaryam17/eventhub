"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import ImageUpload from "@/components/ImageUpload";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  quantity: string;
  condition: string;
  category_id: string;
  is_anonymous: boolean;
  image_url: string;

  pickup_address_line1: string;
  pickup_city: string;
  pickup_state: string;
  pickup_postal_code: string;
  pickup_country: string;
}

interface FormErrors {
  title?: string;
  price?: string;
  quantity?: string;
  condition?: string;
  category_id?: string;
  pickup_address_line1?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_postal_code?: string;
  general?: string;
}

const CATEGORIES: Category[] = [
  { id: 1, name: "Electronics", slug: "electronics" },
  { id: 2, name: "Clothing", slug: "clothing" },
  { id: 3, name: "Books", slug: "books" },
  { id: 4, name: "Home & Garden", slug: "home-garden" },
  { id: 5, name: "Sports", slug: "sports" },
  { id: 6, name: "Toys & Games", slug: "toys-games" },
  { id: 7, name: "Vehicles", slug: "vehicles" },
  { id: 8, name: "Other", slug: "other" },
];

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id;

  const [loadingListing, setLoadingListing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    quantity: "1",
    condition: "used",
    category_id: "",
    is_anonymous: false,
    image_url: "",

    pickup_address_line1: "",
    pickup_city: "",
    pickup_state: "",
    pickup_postal_code: "",
    pickup_country: "Ireland",
  });

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }

        const data = await res.json();
        const l = data.listing;

        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        if (sessionData?.user?.userId !== l.seller_id && sessionData?.user?.role !== "admin") {
          router.push(`/listings/${listingId}`);
          return;
        }

        setForm({
          title: l.title ?? "",
          description: l.description ?? "",
          price: l.price ?? "",
          quantity: String(l.quantity ?? 1),
          condition: l.condition ?? "used",
          category_id: String(l.category_id ?? ""),
          is_anonymous: l.is_anonymous ?? false,
          image_url: l.images?.[0]?.image_url ?? "",

          pickup_address_line1: l.pickup_address_line1 ?? "",
          pickup_city: l.pickup_city ?? "",
          pickup_state: l.pickup_state ?? "",
          pickup_postal_code: l.pickup_postal_code ?? "",
          pickup_country: l.pickup_country ?? "Ireland",
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoadingListing(false);
      }
    }

    fetchListing();
  }, [listingId, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.title.trim() || form.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (form.title.trim().length > 100) {
      newErrors.title = "Title must be 100 characters or less";
    }

    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      newErrors.price = "Enter a valid price";
    }

    if (!form.quantity || isNaN(parseInt(form.quantity)) || parseInt(form.quantity) < 0) {
      newErrors.quantity = "Quantity must be 0 or more";
    }

    if (!form.condition) {
      newErrors.condition = "Select a condition";
    }

    if (!form.category_id) {
      newErrors.category_id = "Select a category";
    }

    if (!form.pickup_address_line1.trim()) {
      newErrors.pickup_address_line1 = "Pickup address is required";
    }

    if (!form.pickup_city.trim()) {
      newErrors.pickup_city = "City is required";
    }

    if (!form.pickup_state.trim()) {
      newErrors.pickup_state = "County / State is required";
    }

    if (!form.pickup_postal_code.trim()) {
      newErrors.pickup_postal_code = "Postal code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity),
          condition: form.condition,
          category_id: parseInt(form.category_id),
          is_anonymous: form.is_anonymous,
          image_url: form.image_url.trim() || undefined,

          pickup_address_line1: form.pickup_address_line1.trim(),
          pickup_city: form.pickup_city.trim(),
          pickup_state: form.pickup_state.trim(),
          pickup_postal_code: form.pickup_postal_code.trim(),
          pickup_country: form.pickup_country.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error ?? "Failed to update listing" });
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(`/listings/${listingId}`);
      }, 1500);
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingListing) {
    return (
      <PageLayout title="Edit listing">
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (notFound) {
    return (
      <PageLayout title="Edit listing">
        <div className="text-center py-24">
          <p className="text-slate-400">
            Listing not found or you don't have permission to edit it.
          </p>
          <Button href="/dashboard" className="mt-4">
            Back to dashboard
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Edit listing"
      subtitle="Update your listing details below"
      showBack
      backHref={`/listings/${listingId}`}
    >
      <div className="max-w-2xl mx-auto">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm mb-6 text-center">
            Listing updated! Redirecting you now...
          </div>
        )}

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Card className="flex flex-col gap-6">
            <Input
              label="Title"
              name="title"
              type="text"
              placeholder="e.g. iPhone 13 128GB — Space Grey"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
              required
            />

            <Textarea
              label="Description"
              name="description"
              placeholder="Describe your item..."
              value={form.description}
              onChange={handleChange}
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Price (€) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    €
                  </span>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    className={`w-full bg-slate-800/60 border ${
                      errors.price ? "border-red-500/50" : "border-slate-700"
                    } rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
              </div>

              <Input
                label="Quantity"
                name="quantity"
                type="number"
                placeholder="1"
                value={form.quantity}
                onChange={handleChange}
                error={errors.quantity}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                error={errors.category_id}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Condition"
                name="condition"
                value={form.condition}
                onChange={handleChange}
                error={errors.condition}
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </Select>
            </div>

            <ImageUpload
              onUpload={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
              currentImage={form.image_url}
            />

            <div className="border border-slate-700/50 rounded-xl p-4 bg-slate-800/40">
              <h3 className="text-sm font-semibold text-white mb-3">Pickup address</h3>
              <p className="text-xs text-slate-500 mb-4">
                This is used to determine whether local collection can be offered to nearby buyers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Address line 1"
                  name="pickup_address_line1"
                  value={form.pickup_address_line1}
                  onChange={handleChange}
                  error={errors.pickup_address_line1}
                />
                <Input
                  label="City"
                  name="pickup_city"
                  value={form.pickup_city}
                  onChange={handleChange}
                  error={errors.pickup_city}
                />
                <Input
                  label="County / State"
                  name="pickup_state"
                  value={form.pickup_state}
                  onChange={handleChange}
                  error={errors.pickup_state}
                />
                <Input
                  label="Postal code"
                  name="pickup_postal_code"
                  value={form.pickup_postal_code}
                  onChange={handleChange}
                  error={errors.pickup_postal_code}
                />
                <Input
                  label="Country"
                  name="pickup_country"
                  value={form.pickup_country}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <input
                type="checkbox"
                id="is_anonymous"
                name="is_anonymous"
                checked={form.is_anonymous}
                onChange={handleChange}
                className="mt-0.5 accent-indigo-500"
              />
              <div>
                <label htmlFor="is_anonymous" className="text-sm font-medium text-white cursor-pointer">
                  List anonymously
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your username will be hidden from buyers. Admins can always see your identity.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting || success} size="lg" fullWidth>
                {submitting ? "Saving changes..." : "Save changes"}
              </Button>
              <Button href={`/listings/${listingId}`} variant="secondary" size="lg">
                Cancel
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </PageLayout>
  );
}