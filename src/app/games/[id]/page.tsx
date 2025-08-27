// src/app/games/[id]/page.tsx
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { publicImageUrl } from "@/lib/public-helpers";
import { supabaseServer, supabaseServerAction } from "@/lib/supabase-server";

import ImageUploader from "@/components/ImageUploader";
import AddComment from "@/components/AddComment";
import AddPlay from "@/components/AddPlay";
import ConfirmButton from "@/components/ConfirmButton";
import GalleryControls from "@/components/GalleryControls";
import MessageBanner from "@/components/MessageBanner";

function fmtDayISO(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function GameDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const imgSort = (Array.isArray(sp.img_sort) ? sp.img_sort[0] : sp.img_sort) ?? "desc"; // "asc"|"desc"
  const imgDate = Array.isArray(sp.img_date) ? sp.img_date[0] : sp.img_date;             // "YYYY-MM-DD"|undefined
  const sortAsc = imgSort === "asc";

  // RSC-Client (ohne await)
  const sb = await supabaseServer();

  // ----- Daten laden -----
  const [{ data: game }, { data: images }, { data: plays }, { data: comments }] = await Promise.all([
    sb
      .from("games")
      .select(
        [
          "id",
          "title",
          "min_players",
          "max_players",
          "play_minutes",
          "owner",
          "bgg_url",
          "bgg_rating",
        ].join(",")
      )
      .eq("id", id)
      .single(),

    (async () => {
      let q = sb
        .from("game_images")
        .select("id, storage_path, caption, is_cover, created_at")
        .eq("game_id", id);

      if (imgDate) {
        // Tagesbereich [imgDate 00:00, nextDay 00:00)
        const start = `${imgDate} 00:00:00`;
        const next = new Date(imgDate);
        next.setDate(next.getDate() + 1);
        const nextStr = next.toISOString().slice(0, 10) + " 00:00:00";
        q = q.gte("created_at", start).lt("created_at", nextStr);
      }

      q = q.order("created_at", { ascending: sortAsc }).order("id", { ascending: sortAsc });

      const { data } = await q;
      return { data };
    })(),

    sb
      .from("plays")
      .select("id, played_at, location, notes, play_results (player_name, score, position)")
      .eq("game_id", id)
      .order("played_at", { ascending: false }),

    sb
      .from("comments")
      .select("body, created_at")
      .eq("game_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const cover = images?.find((c: any) => c.is_cover)?.storage_path;
  const coverUrl = cover ? publicImageUrl(cover) : "/placeholder-game.jpg";

  // Alle vorhandenen Tage (YYYY-MM-DD) für das Dropdown (aus den geladenen Bildern)
  const allDates = Array.from(
    new Set((images ?? []).map((i: any) => String(i.created_at).slice(0, 10)))
  ).sort((a, b) => (sortAsc ? a.localeCompare(b) : b.localeCompare(a)));

  // Kleine JSON-Bridge für das Client-UI (GalleryControls)
  const datesJson = JSON.stringify(allDates);

  // ======== Galerie-Server-Aktionen ========
  async function setCoverAction(formData: FormData) {
    "use server";
    const imageId = String(formData.get("image_id") || "");
    const sbs = supabaseServerAction();

    const { data: auth } = await sbs.auth.getUser();
    if (!auth?.user) throw new Error("Nicht eingeloggt.");

    const { data: g } = await sbs.from("games").select("created_by").eq("id", id).single();
    if (!g || g.created_by !== auth.user.id) throw new Error("Keine Berechtigung.");

    await sbs.from("game_images").update({ is_cover: false }).eq("game_id", id);
    await sbs.from("game_images").update({ is_cover: true }).eq("id", imageId);

    revalidatePath(`/games/${id}`);
  }

  async function saveCaptionAction(formData: FormData) {
    "use server";
    const imageId = String(formData.get("image_id") || "");
    const caption = String(formData.get("caption") || "").slice(0, 200);

    const sbs = supabaseServerAction();
    const { data: auth } = await sbs.auth.getUser();
    if (!auth?.user) throw new Error("Nicht eingeloggt.");

    const { data: g } = await sbs.from("games").select("created_by").eq("id", id).single();
    if (!g || g.created_by !== auth.user.id) throw new Error("Keine Berechtigung.");

    const { error } = await sbs.from("game_images").update({ caption: caption || null }).eq("id", imageId);
    if (error) throw error;

    revalidatePath(`/games/${id}`);
  }

  async function deleteImageAction(formData: FormData) {
    "use server";
    const imageId = String(formData.get("image_id") || "");
    const sbs = supabaseServerAction();

    const { data: auth } = await sbs.auth.getUser();
    if (!auth?.user) throw new Error("Nicht eingeloggt.");

    const { data: g } = await sbs.from("games").select("created_by").eq("id", id).single();
    if (!g || g.created_by !== auth.user.id) throw new Error("Keine Berechtigung.");

    const { data: row, error: rowErr } = await sbs
      .from("game_images")
      .select("id, storage_path")
      .eq("id", imageId)
      .single();
    if (rowErr || !row) throw rowErr ?? new Error("Bild nicht gefunden.");

    const { error: delErr } = await sbs.from("game_images").delete().eq("id", imageId);
    if (delErr) throw delErr;

    if (row.storage_path) {
      await sbs.storage.from("game-images").remove([row.storage_path]);
    }

    revalidatePath(`/games/${id}`);
  }
  // =========================================

  return (
    <div className="space-y-6">
      <MessageBanner />

      {/* Titel + Bearbeiten */}
      <h1 className="text-2xl font-bold flex items-center gap-3">
        {game?.title ?? "Spiel"}
        {game?.id && (
          <span className="text-sm font-normal">
            <Link href={`/games/${game.id}/edit`} className="header-link">
              Bearbeiten
            </Link>
          </span>
        )}
      </h1>

      {/* Info-Leiste */}
      {game && (
        <div className="flex flex-wrap items-center gap-2">
          {game.owner && (
            <span className="chip flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70">
                <path
                  d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-12 12a6 6 0 1 1 12 0H4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Gehört: {game.owner}
            </span>
          )}

          <span className="chip flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70">
              <path
                d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9a6 6 0 1 1 12 0H4Zm14.5-12a2.5 2.5 0 1 1-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {game.min_players ?? "?"}–{game.max_players ?? "?"} Spieler
          </span>

          {game.play_minutes != null && (
            <span className="chip flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70">
                <path
                  d="M12 8v4l3 2m5-2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {game.play_minutes} Min.
            </span>
          )}

          {game.bgg_url && (
            <a
              href={game.bgg_url}
              target="_blank"
              rel="noopener noreferrer"
              className="chip flex items-center gap-2 hover:underline"
              title="Auf BoardGameGeek öffnen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70">
                <path
                  d="M14 3h7v7m0-7L10 14m-3 7H5a2 2 0 0 1-2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              BGG
            </a>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Linke Spalte: Spielergebnisse & Kommentare */}
        <section className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-2">Spielergebnisse</h2>
            <AddPlay gameId={id} />
            <div className="space-y-3 mt-4">
              {plays?.map((p: any) => (
                <div key={p.id} className="rounded-lg bg-gray-50 dark:bg-slate-800 p-3">
                  <div className="text-sm text-gray-600 dark:text-slate-300">
                    {p.played_at} {p.location ? `· ${p.location}` : ""}
                  </div>
                  <ul className="text-sm mt-1">
                    {p.play_results
                      ?.sort((a: any, b: any) => a.position - b.position)
                      .map((r: any, i: number) => (
                        <li key={i}>
                          {r.position}. {r.player_name} – {r.score ?? "–"} Punkte
                        </li>
                      ))}
                  </ul>
                  {p.notes && <div className="text-sm mt-2">{p.notes}</div>}
                </div>
              ))}
              {(!plays || plays.length === 0) && (
                <p className="text-sm text-gray-500">Noch keine Einträge.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-2">Kommentare</h2>
            <AddComment gameId={id} />
            <div className="space-y-3 mt-4">
              {comments?.map((c: any, i: number) => (
                <div key={i} className="text-sm border-b pb-2">
                  {c.body}
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <p className="text-sm text-gray-500">Noch keine Kommentare.</p>
              )}
            </div>
          </div>
        </section>

        {/* Rechte Spalte: Galerie */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Galerie</h2>
            {/* Server -> Client: verfügbare Tage als JSON (für GalleryControls) */}
            <script id="gallery-dates" type="application/json" dangerouslySetInnerHTML={{ __html: datesJson }} />
            <GalleryControls />
          </div>

          {/* Uploader */}
          <ImageUploader gameId={id} />

          {/* Datums-Gruppierung + dünne Trennlinie */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images && images.length > 0 ? (
              (() => {
                const tiles: React.ReactNode[] = [];
                let lastDay: string | null = null;

                images.forEach((img: any) => {
                  const day = fmtDayISO(img.created_at ?? new Date().toISOString());

                  if (day !== lastDay) {
                    tiles.push(
                      <div key={`sep-${day}`} className="col-span-full">
                        <div className="flex items-center gap-3 my-1">
                          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                          <span className="text-xs text-slate-500 whitespace-nowrap">{day}</span>
                          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                    );
                    lastDay = day;
                  }

                  const url = publicImageUrl(img.storage_path);
                  const isCover = !!img.is_cover;
                  const big = isCover ? "md:col-span-2 md:row-span-2" : "";

                  tiles.push(
                    <figure
                      key={img.id}
                      className={`rounded-lg overflow-hidden border dark:border-slate-700 bg-white dark:bg-slate-800 ${big}`}
                    >
                      <div className={`aspect-[4/3] ${isCover ? "md:aspect-[16/10]" : ""}`}>
                        <img src={url} alt={img.caption ?? ""} className="w-full h-full object-cover" />
                      </div>

                      <figcaption className="p-2">
                        {/* Einzeilige Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Untertitel + Speichern */}
                          <form action={saveCaptionAction} className="flex items-center gap-2 flex-1 min-w-[12rem]">
                            <input type="hidden" name="image_id" value={img.id} />
                            <input
                              name="caption"
                              defaultValue={img.caption ?? ""}
                              placeholder="Untertitel"
                              className="input h-9 flex-1"
                            />
                            <button className="btn h-9 px-3 text-sm" type="submit">Speichern</button>
                          </form>

                          {/* Als Titelbild */}
                          {!isCover && (
                            <form action={setCoverAction} className="contents">
                              <input type="hidden" name="image_id" value={img.id} />
                              <button className="btn h-9 px-2 text-sm" title="Als Titelbild" type="submit">
                                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="m12 17 6.18 3.24-1.64-6.99L22 8.24l-7.19-.62L12 1 9.19 7.62 2 8.24l5.46 5.01-1.64 6.99L12 17Z"
                                    stroke="currentColor" strokeWidth="1.3" fill="none"
                                  />
                                </svg>
                                <span className="hidden sm:inline">Titelbild</span>
                              </button>
                            </form>
                          )}

                          {/* Löschen */}
                          <form action={deleteImageAction} className="contents">
                            <input type="hidden" name="image_id" value={img.id} />
                            <ConfirmButton
                              type="submit"
                              className="btn h-9 px-2 text-sm bg-red-600 text-white hover:bg-red-700 border-red-700"
                              confirm="Bild wirklich löschen?"
                            >
                              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10Z" stroke="currentColor" strokeWidth="1.3" />
                              </svg>
                              <span className="hidden sm:inline">Löschen</span>
                            </ConfirmButton>
                          </form>
                        </div>

                        {/* Status unter der Toolbar */}
                        {isCover && (
                          <div className="mt-2">
                            <span className="chip">Titelbild</span>
                          </div>
                        )}
                      </figcaption>
                    </figure>
                  );
                });

                return tiles;
              })()
            ) : (
              <img src={coverUrl} className="w-full object-cover rounded-lg" alt="Platzhalter" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
