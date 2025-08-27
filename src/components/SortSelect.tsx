// src/components/SortSelect.tsx
"use client";
import { useRouter } from "next/navigation";

type Props = {
  value: string;
  params: Record<string, string | undefined>;
};

export default function SortSelect({ value, params }: Props) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    );
    p.set("sort", e.target.value);
    // bei Sortierung auf Seite 1 zurück
    p.set("page", "1");
    router.push(`/?${p.toString()}`);
  }

  return (
    <select
      className="select"
      defaultValue={value}
      onChange={onChange}
      aria-label="Sortieren"
    >
      <option value="title_asc">A–Z</option>
      <option value="title_desc">Z–A</option>
      <option value="rating_desc">BGG ↑</option>
      <option value="rating_asc">BGG ↓</option>
      <option value="created_desc">Neueste zuerst</option>
      <option value="created_asc">Älteste zuerst</option>
    </select>
  );
}
