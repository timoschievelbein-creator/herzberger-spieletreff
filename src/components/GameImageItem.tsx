"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { publicImageUrl } from "@/lib/public-helpers";

type Img = {
  id: string;
  game_id: string;
  storage_path: string;
  caption?: string | null;
  is_cover: boolean;
};

export default function GameImageItem({ img }: { img: Img }) {
  const r = useRouter();
  const [open, setOpen] = useState(false); // Lightbox

  const setCover = async () => {
    const sb = supabaseBrowser();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return alert("Bitte einloggen.");

    // erst alle Cover des Spiels zurücksetzen, dann dieses setzen
    const { error: e1 } = await sb.from("game_images").update({ is_cover: false }).eq("game_id", img.game_id);
    if (e1) return alert(e1.message);

    const { error: e2 } = await sb.from("game_images").update({ is_cover: true }).eq("id", img.id);
    if (e2) return alert(e2.message);

    r.refresh();
  };

  const remove = async () => {
    if (!confirm("Bild wirklich löschen?")) return;
    const sb = supabaseBrowser();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return alert("Bitte einloggen.");

    const { error: dberr } = await sb.from("game_images").delete().eq("id", img.id);
    if (dberr) return alert(dberr.message);

    // Datei im Storage löschen (kann fehlschlagen, wenn du nicht der Uploader warst)
    const { error: sterr } = await sb.storage.from("game-images").remove([img.storage_path]);
    if (sterr) console.warn("Storage delete:", sterr.message);

    r.refresh();
  };

  // ESC schließt Lightbox
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const url = publicImageUrl(img.storage_path);

  return (
    <figure className="overflow-hidden rounded-lg border bg-white">
      <button className="block w-full" onClick={() => setOpen(true)}>
        <img src={url} className="w-full h-40 object-cover" alt={img.caption ?? ""} />
      </button>
      <figcaption className="text-xs text-slate-700 p-2 flex items-center justify-between gap-2">
        <span className="truncate">{img.caption}</span>
        <div className="flex items-center gap-2">
          {!img.is_cover && <button className="btn text-xs" onClick={setCover}>Als Titelbild</button>}
          <button className="btn text-xs" onClick={remove}>Löschen</button>
        </div>
      </figcaption>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt={img.caption ?? ""} className="w-full max-h-[80vh] object-contain rounded-lg" />
            {img.caption && <div className="mt-2 text-sm text-slate-200">{img.caption}</div>}
            <div className="mt-3 flex gap-2">
              {!img.is_cover && <button className="btn" onClick={setCover}>Als Titelbild</button>}
              <button className="btn" onClick={remove}>Löschen</button>
              <button className="btn ml-auto" onClick={() => setOpen(false)}>Schließen (Esc)</button>
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
