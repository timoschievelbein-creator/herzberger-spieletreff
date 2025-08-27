// src/components/ImageUploader.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Props = { gameId: string };

export default function ImageUploader({ gameId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [asCover, setAsCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const sb = supabaseBrowser();

  async function onUpload() {
    if (!file || busy) return;
    setBusy(true);
    try {
      // stabiler Pfad
      const clean = file.name.replace(/\s+/g, "_");
      const path = `${gameId}/${Date.now()}-${clean}`;

      const up = await sb.storage
        .from("game-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (up.error) throw up.error;

      // DB-Zeile inkl. created_at schreiben (DB hat auch DEFAULT now())
      const { error: insErr } = await sb.from("game_images").insert({
        game_id: gameId,
        storage_path: path,
        caption: caption || null,
        is_cover: asCover,
        created_at: new Date().toISOString(),
      });
      if (insErr) throw insErr;

      // zurücksetzen + neu laden
      setFile(null);
      setCaption("");
      setAsCover(false);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          Datei wählen
        </label>

        <input
          className="input max-w-sm"
          placeholder="Untertitel"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={asCover}
            onChange={(e) => setAsCover(e.target.checked)}
          />
          als Titelbild setzen
        </label>

        <button
          className="btn-primary disabled:opacity-50"
          onClick={onUpload}
          disabled={!file || busy}
          type="button"
        >
          {busy ? "Lädt..." : "Hochladen"}
        </button>
      </div>

      {file && (
        <div className="text-xs opacity-70">
          Ausgewählt: <strong>{file.name}</strong>
        </div>
      )}
    </div>
  );
}
