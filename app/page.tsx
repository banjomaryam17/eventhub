"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

// Placeholder listing card data (replace with real API data later)
const PLACEHOLDER_LISTINGS = [
  { id: 1, title: "Sony WH-1000XM5 Headphones", price: 220, condition: "used", category: "Electronics", image: null, seller: "audiogeek", rating: 4.5 },
  { id: 2, title: "Nike Air Max 90 — Size 10", price: 85, condition: "used", category: "Clothing", image: null, seller: "sneakerhead", rating: 4.0 },
  { id: 3, title: "The Pragmatic Programmer", price: 18, condition: "new", category: "Books", image: null, seller: "devbooks", rating: 5.0 },
  { id: 4, title: "IKEA KALLAX Shelf Unit", price: 45, condition: "used", category: "Home & Garden", image: null, seller: "homestuff", rating: 3.5 },
  { id: 5, title: "iPad Pro 11\" 2022 256GB", price: 650, condition: "refurbished", category: "Electronics", image: null, seller: "techresell", rating: 4.5 },
  { id: 6, title: "Levi's 501 Jeans W32 L30", price: 35, condition: "used", category: "Clothing", image: null, seller: "vintagewear", rating: 4.0 },
];

const CATEGORIES = [
  { name: "Electronics", icon: "💻", slug: "electronics" },
  { name: "Clothing", icon: "👕", slug: "clothing" },
  { name: "Books", icon: "📚", slug: "books" },
  { name: "Home & Garden", icon: "🏡", slug: "home-garden" },
  { name: "Sports", icon: "⚽", slug: "sports" },
  { name: "Toys & Games", icon: "🎮", slug: "toys-games" },
  { name: "Vehicles", icon: "🚗", slug: "vehicles" },
  { name: "Other", icon: "📦", slug: "other" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-3 h-3" fill={i <= Math.round(rating) ? "#f59e0b" : "#334155"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ListingCard({ listing }: { listing: typeof PLACEHOLDER_LISTINGS[0] }) {
  const conditionColor = {
    new: "text-emerald-400 bg-emerald-400/10",
    used: "text-amber-400 bg-amber-400/10",
    refurbished: "text-blue-400 bg-blue-400/10",
  }[listing.condition] ?? "text-slate-400 bg-slate-400/10";

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200">
        {/* Image placeholder */}
        <div className="aspect-square bg-slate-800 flex items-center justify-center relative overflow-hidden">
          <div className="text-5xl opacity-20">🛍</div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${conditionColor}`}>
            {listing.condition}
          </span>
        </div>
        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-slate-500 mb-1">{listing.category}</p>
          <h3 className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
            {listing.title}
          </h3>
          <StarRating rating={listing.rating} />
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-white">€{listing.price}</span>
            <span className="text-xs text-slate-500">@{listing.seller}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

