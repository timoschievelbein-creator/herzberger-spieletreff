"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [ready, setReady] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("hst-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ? stored === "dark" : prefers;
    root.classList.toggle("dark", initial);
    setIsDark(initial);
    setReady(true);
  }, []);

  if (!ready) return null;

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("hst-theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Theme umschalten"
      className="rounded-md border px-2 py-1 bg-white/80 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
      title={isDark ? "Heller Modus" : "Dunkler Modus"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
