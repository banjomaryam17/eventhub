"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Login successful
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }

    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-4">
    <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-xl p-8">

        <h1 className="text-3xl font-semibold text-center text-slate-800">
        EventHub
        </h1>
        <p className="text-center text-slate-500 mt-2">
        Connect • Share • Discover
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
        
        <input 
            type="username"
            placeholder="Username"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
        />

        <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
        />

        <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
        />

        {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button type="submit" className="w-full rounded-xl bg-slate-800 text-white py-3 font-medium hover:bg-slate-700 transition disabled:opacity-50">Create Account</button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <a href="/auth/register" className="text-slate-800 font-medium">
            Login in
        </a>
        </p>
    </div>
    </div>
);
}
