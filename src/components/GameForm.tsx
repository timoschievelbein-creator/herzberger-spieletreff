"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Game = {
  id?: string;
  title?: string;
  title_alt?: string | null;
  bgg_url?: string | null;
  bgg_rating?: number | null;
  owner?: string | null;
  loaned_to?: string | null;
  award?: string | null;
  info?: string | null;
  rules_url?: string | null;
  image_url?: string | null;
  notes?: string | null;
  status?: "active" | "archived";
  min_players?: number | null;
  max_players?: number | null;
  playtime_min?: number | null;
  playtime_max?: number | null;
  weight?: number | null;            // 1.0–5.0
  is_coop?: boolean | null;
};

export default function GameForm({ game }: { game?: Game }) {
  const r = useRouter();
  const [form, setForm] = useState<Game>({
    title: game?.title ?? "",
    title_alt: game?.title_alt ?? "",
    bgg_url: game?.bgg_url ?? "",
    bgg_rating: game?.bgg_rating ?? undefined,
    owner: game?.owner ?? "",
    loaned_to: game?.loaned_to ?? "",
    award: game?.award ?? "",
    info: game?.info ?? "",
    rules_url: game?.rules_url ?? "",
    image_url: game?.image_url ?? "",
    notes: game?.notes ?? "",
    status: (game?.status as any) ?? "active",
    min_players: game?.min_players ?? undefined,
    max_players: game?.max_players ?? undefined,
    playtime_min: game?.playtime_min ?? undefined,
    playtime_max: game?.playtime_max ?? undefined,
    weight: game?.weight ?? undefined,
    is_coop: game?.is_coop ?? false,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (k: keyof Game) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const num = (v: any) =>
    v !== undefined && v !== null && String(v) !== "" ? Number(v) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const sb = supabaseBrowser();

    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) { setErr("Bitte zuerst einloggen."); setBusy(false); return; }

    if (!form.title || form.title.trim().length < 1) {
      setErr("Titel darf nicht leer sein."); setBusy(false); return;
    }

    if (form.min_players && form.max_players && form.min_players > form.max_players) {
      setErr("Spieler: Min darf nicht größer als Max sein."); setBusy(false); return;
    }
    if (form.playtime_min && form.playtime_max && form.playtime_min > form.playtime_max) {
      setErr("Spielzeit: Min darf nicht größer als Max sein."); setBusy(false); return;
    }

    const payload = {
      title: form.title!.trim(),
      title_alt: form.title_alt?.trim() || null,
      bgg_url: form.bgg_url?.trim() || null,
      bgg_rating: num(form.bgg_rating),
      owner: form.owner?.trim() || null,
      loaned_to: form.loaned_to?.trim() || null,
      award: form.award?.trim() || null,
      info: form.info?.trim() || null,
      rules_url: form.rules_url?.trim() || null,
      image_url: form.image_url?.trim() || null,
      notes: form.notes?.trim() || null,
      status: (form.status as any) ?? "active",
      min_players: num(form.min_players),
      max_players: num(form.max_players),
      playtime_min: num(form.playtime_min),
      playtime_max: num(form.playtime_max),
      weight: num(form.weight),
      is_coop: !!form.is_coop,
      updated_at: new Date().toISOString(),
    };

    try {
      if (game?.id) {
        const { error } = await sb.from("games").update(payload).eq("id", game.id);
        if (error) throw error;
        r.push(`/games/${game.id}`);
      } else {
        const { data, error } = await sb
          .from("games")
          .insert({ ...payload, created_by: auth.user.id })
          .select("id")
          .single();
        if (error) throw error;
        r.push(`/games/${data!.id}`);
      }
    } catch (e: any) {
      setErr(e.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Titel *</label>
          <input className="input" value={form.title} onChange={onChange("title")} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Alternativtitel</label>
          <input className="input" value={form.title_alt ?? ""} onChange={onChange("title_alt")} />
        </div>

        <div>
          <label className="block text-sm mb-1">BGG-URL</label>
          <input className="input" value={form.bgg_url ?? ""} onChange={onChange("bgg_url")} />
        </div>
        <div>
          <label className="block text-sm mb-1">BGG-Bewertung</label>
          <input className="input" type="number" step="0.01" value={form.bgg_rating ?? ""} onChange={onChange("bgg_rating")} />
        </div>

        <div>
          <label className="block text-sm mb-1">Gehört (Besitzer)</label>
          <input className="input" value={form.owner ?? ""} onChange={onChange("owner")} />
        </div>
        <div>
          <label className="block text-sm mb-1">Ausgeliehen an</label>
          <input className="input" value={form.loaned_to ?? ""} onChange={onChange("loaned_to")} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Spieler min</label>
            <input className="input" type="number" min={1} value={form.min_players ?? ""} onChange={onChange("min_players")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Spieler max</label>
            <input className="input" type="number" min={1} value={form.max_players ?? ""} onChange={onChange("max_players")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Spielzeit min (Min.)</label>
            <input className="input" type="number" min={0} value={form.playtime_min ?? ""} onChange={onChange("playtime_min")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Spielzeit max (Min.)</label>
            <input className="input" type="number" min={0} value={form.playtime_max ?? ""} onChange={onChange("playtime_max")} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Gewicht (1–5)</label>
          <input className="input" type="number" min={1} max={5} step="0.1" value={form.weight ?? ""} onChange={onChange("weight")} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!form.is_coop} onChange={onChange("is_coop")} />
          Kooperatives Spiel
        </label>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Auszeichnung</label>
          <input className="input" value={form.award ?? ""} onChange={onChange("award")} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Anleitung (URL)</label>
          <input className="input" value={form.rules_url ?? ""} onChange={onChange("rules_url")} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Weitere Infos</label>
          <textarea className="input" rows={3} value={form.info ?? ""} onChange={onChange("info")} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Bemerkung</label>
          <textarea className="input" rows={2} value={form.notes ?? ""} onChange={onChange("notes")} />
        </div>

        <div>
          <label className="block text-sm mb-1">Status</label>
          <select className="input" value={form.status ?? "active"} onChange={onChange("status")}>
            <option value="active">aktiv (in Sammlung)</option>
            <option value="archived">archiviert (ausgetragen)</option>
          </select>
        </div>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="flex gap-2">
        <button className="btn" disabled={busy}>{game?.id ? "Speichern" : "Anlegen"}</button>
        <button type="button" className="btn" onClick={() => history.back()} disabled={busy}>Abbrechen</button>
      </div>
    </form>
  );
}
