"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Zeile 1: Suchfeld (links) – die Sortierung steht in page.tsx rechts daneben
 * Zeile 2: Buttons für Spielerzahl-Filter
 *
 * URL-Parameter:
 *  - q: Suchstring
 *  - players: "2" | "3" | "4" | "5" | "6plus"  (optional)
 */
export default function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const players = sp.get("players") ?? ""; // "", "2", "3", "4", "5", "6plus"

  const params = useMemo(() => new URLSearchParams(sp), [sp]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    // bei Filterwechsel auf Seite 1
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  };

  // Suche debounced anwenden
  useEffect(() => {
    const t = setTimeout(() => update({ q }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const togglePlayers = (val: string) => {
    update({ players: players === val ? undefined : val });
  };

  const btn = (label: string, val: string) => (
    <button
      key={val}
      type="button"
      onClick={() => togglePlayers(val)}
      className={`btn px-3 py-2 ${
        players === val ? "ring-2 ring-emerald-500" : ""
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1">
      {/* Zeile 1: nur das Suchfeld (SortSelect kommt von der Seite rechts daneben) */}
      <div className="flex items-center gap-3">
        <input
          className="input w-full"
          placeholder="Spiel suchen..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Zeile 2: Spielerzahl-Buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-sm opacity-80 mr-1">Schnellauswahl:</span>
        {btn("2 Spieler", "2")}
        {btn("3 Spieler", "3")}
        {btn("4 Spieler", "4")}
        {btn("5 Spieler", "5")}
        {btn("6 Spieler+", "6plus")}
        <button
          type="button"
          className="btn ml-2"
          onClick={() => update({ q: undefined, players: undefined })}
          title="Filter zurücksetzen"
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}
