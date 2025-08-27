// src/app/news/page.tsx
import { supabaseServer, supabaseServerAction } from "@/lib/supabase-server";
import { publicImageUrl } from "@/lib/public-helpers";
import EmblaCarousel from "@/components/EmblaCarousel";
import { revalidatePath } from "next/cache";

// Kommentar speichern (Server Action)
async function addNewsComment(formData: FormData) {
  "use server";
  const sbs = supabaseServerAction();

  const { data: userData, error: userErr } = await sbs.auth.getUser();
  if (userErr) throw userErr;
  if (!userData?.user) throw new Error("Nicht eingeloggt.");

  const game_id = String(formData.get("game_id") ?? "");
  const news_date = String(formData.get("news_date") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!game_id || !news_date || !body) return;

  const { error } = await sbs
    .from("news_comments")
    .insert({ game_id, news_date, body, created_by: userData.user.id });

  if (error) throw error;
  revalidatePath("/news");
}

type NewsItem = {
  gameId: string;
  title: string;
  date: string; // YYYY-MM-DD
  plays: any[];
  images: { id: string; storage_path: string; caption: string | null }[];
  comments: { id: string; body: string; created_at: string }[];
};

export default async function NewsPage() {
  // WICHTIG: keine async-Funktion, daher hier OHNE await
  const sb = await supabaseServer();

  // Letzte Sessions
  const { data: plays } = await sb.from("plays")
    .select(
      "id, game_id, played_at, location, notes, play_results(player_name, score, position), games(title)"
    )
    .order("played_at", { ascending: false })
    .limit(50);

  // Nach Tag + Spiel gruppieren
  const groups = new Map<string, NewsItem>();
  for (const p of plays ?? []) {
    const d = (p.played_at ?? "").slice(0, 10);
    const key = `${p.game_id}__${d}`;
    if (!groups.has(key)) {
      groups.set(key, {
        gameId: p.game_id,
        title: p.games?.title ?? "Spiel",
        date: d,
        plays: [],
        images: [],
        comments: [],
      });
    }
    groups.get(key)!.plays.push(p);
  }

  const items = Array.from(groups.values()).slice(0, 10);

  const dayRange = (yyyyMmDd: string) => {
    const start = new Date(`${yyyyMmDd}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Bilder & Kommentare laden
  await Promise.all(
    items.map(async (it) => {
      const { start, end } = dayRange(it.date);

      const { data: imgs } = await sb
        .from("game_images")
        .select("id, storage_path, caption, created_at")
        .eq("game_id", it.gameId)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true });

      it.images =
        imgs?.map((g) => ({
          id: String(g.id),
          storage_path: g.storage_path as string,
          caption: (g as any).caption ?? null,
        })) ?? [];

      const { data: coms } = await sb
        .from("news_comments")
        .select("id, body, created_at")
        .eq("game_id", it.gameId)
        .eq("news_date", it.date)
        .order("created_at", { ascending: true });

      it.comments = (coms as any[]) ?? [];
    })
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">News</h1>

      {items.length === 0 && (
        <p className="text-sm text-slate-500">Noch keine News vorhanden.</p>
      )}

      {items.map((it) => {
        const slides =
          it.images.map((img) => ({
            id: img.id,
            src: publicImageUrl(img.storage_path),
            alt: img.caption ?? "",
          })) ?? [];

        return (
          <article
            key={`${it.gameId}_${it.date}`}
            className="card space-y-4 border-t pt-4"
          >
            <header className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{it.title}</h2>
              <time className="text-sm opacity-70">{it.date}</time>
            </header>

            {slides.length > 0 ? (
              <EmblaCarousel slides={slides} />
            ) : (
              <div className="text-sm text-slate-500">
                Keine Fotos für diesen Tag.
              </div>
            )}

            <section className="space-y-2">
              <h3 className="font-semibold">Ergebnisse</h3>
              {it.plays.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-gray-50 dark:bg-slate-800 p-3"
                >
                  <div className="text-sm text-gray-600 dark:text-slate-300">
                    {p.played_at} {p.location ? `· ${p.location}` : ""}
                  </div>
                  <ul className="text-sm mt-1">
                    {p.play_results
                      ?.slice()
                      .sort(
                        (a: any, b: any) =>
                          (a.position ?? 999) - (b.position ?? 999)
                      )
                      .map((r: any, i: number) => (
                        <li key={i}>
                          {r.position}. {r.player_name} – {r.score ?? "–"} Punkte
                        </li>
                      ))}
                  </ul>
                  {p.notes && <div className="text-sm mt-2">{p.notes}</div>}
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Kommentare</h3>
              <div className="space-y-2">
                {it.comments.length ? (
                  it.comments.map((c) => (
                    <div key={c.id} className="text-sm border-b pb-2">
                      {c.body}
                      <div className="text-[11px] opacity-60">
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Noch keine Kommentare.
                  </p>
                )}
              </div>

              <form action={addNewsComment} className="flex gap-2">
                <input type="hidden" name="game_id" value={it.gameId} />
                <input type="hidden" name="news_date" value={it.date} />
                <input
                  name="body"
                  className="input flex-1"
                  placeholder="Kommentar schreiben…"
                />
                <button className="btn-primary" type="submit">
                  Senden
                </button>
              </form>
            </section>
          </article>
        );
      })}
    </div>
  );
}
