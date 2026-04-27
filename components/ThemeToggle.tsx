"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      document.documentElement.classList.add("light-mode");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light-mode");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-50 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white shadow-lg hover:bg-slate-800 transition-colors"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}