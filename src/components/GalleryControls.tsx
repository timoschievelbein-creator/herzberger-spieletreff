// src/components/GalleryControls.tsx
"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GalleryControls() {
  const router = useRouter();
  const sp = useSearchParams();

  // aktuelle Params
  const imgSort = sp.get("img_sort") === "asc" ? "asc" : "desc";
  const imgDate = sp.get("img_date") ?? "";

  // Liste der verfügbaren Tage kommt aus <script id="gallery-dates">
  const dates: string[] = useMemo(() => {
    try {
      const el = document.getElementById("gallery-dates");
      if (!el) return [];
      const json = el.textContent || "[]";
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  function setParam(key: string, value?: string) {
    const p = new URLSearchParams(sp.toString());
    if (value && value.length) p.set(key, value);
    else p.delete(key);
    // Bei Sort-/Filteränderung auf gleiche Seite bleiben (Detailseite)
    router.push(`?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sort-Toggle */}
      <button
        type="button"
        className="btn text-sm"
        onClick={() => setParam("img_sort", imgSort === "asc" ? "desc" : "asc")}
        title="Sortierung umschalten"
      >
        Sortierung: {imgSort === "asc" ? "Älteste → Neueste" : "Neueste → Älteste"}
      </button>

      {/* Tagesfilter */}
      <div className="flex items-center gap-2">
        <select
          className="select text-sm"
          value={imgDate}
          onChange={(e) => setParam("img_date", e.target.value || undefined)}
          title="Nach Datum filtern"
        >
          <option value="">Alle Tage</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {new Date(d).toLocaleDateString("de-DE")}
            </option>
          ))}
        </select>

        {imgDate && (
          <button type="button" className="btn text-sm" onClick={() => setParam("img_date", undefined)}>
            Filter löschen
          </button>
        )}
      </div>
    </div>
  );
}
