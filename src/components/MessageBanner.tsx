"use client";
import { useEffect, useState } from "react";

export default function MessageBanner() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get("m");
    if (m) {
      const text =
        m === "gespeichert" ? "Änderungen gespeichert." :
        m === "gelöscht"    ? "Eintrag gelöscht." :
        m;
      setMsg(text);
      // nach 4s ausblenden
      const t = setTimeout(()=>setMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!msg) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md
                    bg-emerald-600 text-white shadow-lg">
      {msg}
    </div>
  );
}
