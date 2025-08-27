// src/components/Flash.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Flash() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const msg = sp.get("m"); // success message
  const err = sp.get("e"); // error message
  const [visible, setVisible] = useState<boolean>(!!(msg || err));

  const text = useMemo(() => {
    if (!msg && !err) return null;
    const map: Record<string, string> = {
      gespeichert: "Änderungen gespeichert.",
      geloescht: "Eintrag gelöscht.",
      gelöscht: "Eintrag gelöscht.",
      login: "Anmeldung erfolgreich.",
      logout: "Abgemeldet.",
    };
    const raw = (msg ?? err) as string;
    return map[raw] ?? raw; // unbekannte Texte 1:1 anzeigen
  }, [msg, err]);

  const tone = err ? "error" : "ok";

  const clearFromUrl = () => {
    const usp = new URLSearchParams(sp.toString());
    usp.delete("m");
    usp.delete("e");
    const q = usp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (!msg && !err) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      clearFromUrl();
    }, 3500);
    return () => clearTimeout(t);
  }, [msg, err]); // neu anzeigen bei Navigation

  if (!text || !visible) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[100] -translate-x-1/2">
      <div
        role="status"
        className={`shadow-lg rounded-lg px-4 py-2 border text-sm
          ${tone === "ok"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-700"
            : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700"}`}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block text-lg leading-none">
            {tone === "ok" ? "✅" : "⚠️"}
          </span>
          <span>{text}</span>
          <button
            aria-label="Hinweis schließen"
            className="ml-2 opacity-70 hover:opacity-100"
            onClick={() => {
              setVisible(false);
              clearFromUrl();
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
