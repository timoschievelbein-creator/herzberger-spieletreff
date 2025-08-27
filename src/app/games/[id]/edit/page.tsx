// src/app/games/[id]/edit/page.tsx
import { supabaseServer, supabaseServerAction } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ConfirmButton from "@/components/ConfirmButton";

export default async function EditGame({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Lesen in RSC
  const sb = await supabaseServer();
  const { data: game, error } = await sb
    .from("games")
    .select(
      [
        "id",
        "created_by",
        "title",
        "alt_title",
        "bgg_url",
        "bgg_rating",
        "owner",
        "award",
        "manual_url",
        "more_info",
        "notes",
        "min_players",
        "max_players",
        "play_minutes",
        "weight",
        "is_coop",
        "status",
      ].join(",")
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !game) {
    return <div className="card">Spiel nicht gefunden.</div>;
  }

  // ---------- Update ----------
  async function updateGameAction(formData: FormData) {
    "use server";
    const sbs = await supabaseServerAction();

    // Berechtigung
    const { data: auth } = await sbs.auth.getUser();
    const user = auth?.user;
    if (!user) throw new Error("Nicht eingeloggt.");
    const { data: g, error: gErr } = await sbs
      .from("games")
      .select("created_by")
      .eq("id", id)
      .maybeSingle();
    if (gErr) throw new Error(gErr.message);
    if (!g) throw new Error("Spiel existiert nicht.");
    if (g.created_by !== user.id) throw new Error("Keine Berechtigung.");

    const v = (k: string) => (formData.get(k)?.toString().trim() ?? "");
    const toInt = (k: string) => {
      const s = v(k);
      if (s === "") return null;
      const n = parseInt(s, 10);
      return Number.isNaN(n) ? null : n;
    };
    const toFloat = (k: string) => {
      const s = v(k);
      if (s === "") return null;
      const n = parseFloat(s.replace(",", "."));
      return Number.isNaN(n) ? null : n;
    };
    const toBool = (k: string) => formData.get(k) === "on";

    const patch: Record<string, any> = {
      title: v("title") || null,
      alt_title: v("alt_title") || null,
      bgg_url: v("bgg_url") || null,
      bgg_rating: toFloat("bgg_rating"),
      owner: v("owner") || null,
      award: v("award") || null,
      manual_url: v("manual_url") || null,
      more_info: v("more_info") || null,
      notes: v("notes") || null,
      min_players: toInt("min_players"),
      max_players: toInt("max_players"),
      play_minutes: toInt("play_minutes"),
      weight: toFloat("weight"),
      is_coop: toBool("is_coop"),
      status: v("status") || "active",
    };

    const { error: upErr } = await sbs.from("games").update(patch).eq("id", id);
    if (upErr) throw new Error(upErr.message);

    revalidatePath(`/games/${id}`);
    redirect(`/games/${id}?m=gespeichert`);
  }

  // ---------- Delete ----------
  async function deleteGameAction() {
    "use server";
    const sbs = await supabaseServerAction();

    const { data: auth } = await sbs.auth.getUser();
    const user = auth?.user;
    if (!user) throw new Error("Nicht eingeloggt.");

    const { data: g, error: gErr } = await sbs
      .from("games")
      .select("id, created_by")
      .eq("id", id)
      .maybeSingle();
    if (gErr) throw new Error(gErr.message);
    if (!g) throw new Error("Spiel existiert nicht.");
    if (g.created_by !== user.id) throw new Error("Keine Berechtigung.");

    const { data: delRow, error: delErr } = await sbs
      .from("games")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (delErr) throw new Error(delErr.message);
    if (!delRow) throw new Error("Nichts gelöscht (0 Zeilen).");

    revalidatePath("/");
    redirect("/?m=gelöscht");
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">„{game.title}“ bearbeiten</h1>

      {/* Bearbeitungsformular */}
      <form action={updateGameAction} className="card space-y-4">
        {/* Titel + Alternativtitel */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Titel *</label>
            <input
              name="title"
              className="input"
              defaultValue={game.title ?? ""}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Alternativtitel</label>
            <input
              name="alt_title"
              className="input"
              defaultValue={game.alt_title ?? ""}
            />
          </div>
        </div>

        {/* BGG */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">BGG-URL</label>
            <input
              name="bgg_url"
              className="input"
              defaultValue={game.bgg_url ?? ""}
              placeholder="https://boardgamegeek.com/..."
            />
          </div>
          <div>
            <label className="block text-sm mb-1">BGG-Bewertung</label>
            <input
              name="bgg_rating"
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="input"
              defaultValue={game.bgg_rating ?? ""}
            />
          </div>
        </div>

        {/* Spieler / Spielzeit / Gewicht / Koop */}
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1">Min. Spieler</label>
            <input
              name="min_players"
              type="number"
              min="1"
              className="input"
              defaultValue={game.min_players ?? ""}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Max. Spieler</label>
            <input
              name="max_players"
              type="number"
              min="1"
              className="input"
              defaultValue={game.max_players ?? ""}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Spielzeit (Min.)</label>
            <input
              name="play_minutes"
              type="number"
              min="0"
              className="input"
              defaultValue={game.play_minutes ?? ""}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Gewicht (1–5)</label>
            <input
              name="weight"
              type="number"
              step="0.1"
              min="1"
              max="5"
              className="input"
              defaultValue={game.weight ?? ""}
            />
          </div>
        </div>

        {/* Koop-Flag */}
        <div className="flex items-center gap-3">
          <input
            id="is_coop"
            name="is_coop"
            type="checkbox"
            defaultChecked={!!game.is_coop}
            className="h-4 w-4"
          />
          <label htmlFor="is_coop" className="text-sm">
            Koop-Spiel
          </label>
        </div>

        {/* Besitzer / Auszeichnung / Anleitung */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Gehört (Besitzer)</label>
            <input name="owner" className="input" defaultValue={game.owner ?? ""} />
          </div>
          <div>
            <label className="block text-sm mb-1">Auszeichnung</label>
            <input name="award" className="input" defaultValue={game.award ?? ""} />
          </div>
          <div>
            <label className="block text-sm mb-1">Anleitung (URL)</label>
            <input
              name="manual_url"
              className="input"
              defaultValue={game.manual_url ?? ""}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Weitere Infos / Bemerkung */}
        <div>
          <label className="block text-sm mb-1">Weitere Infos</label>
          <textarea
            name="more_info"
            className="input"
            rows={3}
            defaultValue={game.more_info ?? ""}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Bemerkung</label>
          <textarea
            name="notes"
            className="input"
            rows={3}
            defaultValue={game.notes ?? ""}
          />
        </div>

        {/* Status */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              name="status"
              className="select w-full"
              defaultValue={game.status ?? "active"}
            >
              <option value="active">aktiv</option>
              <option value="archived">archiviert</option>
            </select>
          </div>
        </div>

        {/* Form-Buttons */}
        <div className="flex gap-3 pt-2">
          <button className="btn-primary" type="submit">
            Änderungen speichern
          </button>
          <a href={`/games/${id}`} className="btn">
            Abbrechen
          </a>
        </div>
      </form>

      {/* Gefahrenzone */}
      <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
        <h2 className="font-semibold text-red-700 dark:text-red-300">Gefahrenzone</h2>
        <p className="text-sm mb-3">
          Dieses Spiel dauerhaft löschen. Verbundene Spielergebnisse, Kommentare und
          Galeriebilder werden (bei ON DELETE CASCADE) ebenfalls gelöscht.
        </p>
        <form>
          <ConfirmButton
            type="submit"
            className="btn bg-red-600 text-white hover:bg-red-700 border-red-700 dark:hover:bg-red-700"
            confirm="Wirklich endgültig löschen?"
            formAction={deleteGameAction}
          >
            Spiel löschen
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
