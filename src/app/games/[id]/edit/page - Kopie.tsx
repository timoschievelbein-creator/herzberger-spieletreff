import { supabaseServer } from "@/lib/supabase-server";
import { publicImageUrl } from "@/lib/public-helpers"; // ← so

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ConfirmButton from "@/components/ConfirmButton";

import ImageUploader from "@/components/ImageUploader";
import AddComment from "@/components/AddComment";
import AddPlay from "@/components/AddPlay";
import Link from "next/link";

export default async function GameDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await supabaseServer();

  // Spiel + Bilder + Ergebnisse + Kommentare laden
  const [{ data: game }, { data: images }, { data: plays }, { data: comments }] =
    await Promise.all([
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
      sb
        .from("game_images")
        .select("*")
        .eq("game_id", id)
        .order("is_cover", { ascending: false }),
      sb
        .from("plays")
        .select(
          "id, played_at, location, notes, play_results (player_name, score, position)"
        )
        .eq("game_id", id)
        .order("played_at", { ascending: false }),
      sb
        .from("comments")
        .select("body, created_at")
        .eq("game_id", id)
        .order("created_at", { ascending: false }),
    ]);

  // Fallbacks
  const cover = images?.find((c: any) => c.is_cover)?.storage_path;
  const coverUrl = cover ? publicImageUrl(cover) : "/placeholder-game.jpg";

  return (
    <div className="space-y-6">
      {/* Titel + Bearbeiten */}
      <h1 className="text-2xl font-bold flex items-center gap-3">
        {game?.title}
        {game?.id && (
          <span className="text-sm font-normal">
            <Link href={`/games/${game.id}/edit`} className="header-link">
              Bearbeiten
            </Link>
          </span>
        )}
      </h1>

      {/* ▶︎ KOMPAKTE INFO-LEISTE */}
      {game && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Spieler */}
          <span className="chip flex items-center gap-2">
            {/* users-icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-70"
            >
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

          {/* Spieldauer */}
          {game.play_minutes != null && (
            <span className="chip flex items-center gap-2">
              {/* clock-icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-70"
              >
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

          {/* Besitzer */}
          {game.owner && (
            <span className="chip flex items-center gap-2">
              {/* user-icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-70"
              >
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

          {/* BoardGameGeek-Link */}
          {game.bgg_url && (
            <a
              href={game.bgg_url}
              target="_blank"
              rel="noopener noreferrer"
              className="chip flex items-center gap-2 hover:underline"
              title="Auf BoardGameGeek öffnen"
            >
              {/* external-link icon als „BGG“-Chip */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-70"
              >
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

            {/* Formular zum Erfassen eines neuen Spielergebnisses */}
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
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Galerie</h2>
          </div>

          <div className="mb-4">
            <ImageUploader gameId={id} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images && images.length > 0 ? (
              images.map((img: any) => (
                <figure key={img.id} className="overflow-hidden rounded-lg">
                  <img
                    src={publicImageUrl(img.storage_path)}
                    className="w-full h-40 object-cover"
                    alt={img.caption ?? ""}
                  />
                  {img.caption && (
                    <figcaption className="text-xs text-gray-600 mt-1">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))
            ) : (
              <img
                src={coverUrl}
                className="w-full object-cover rounded-lg"
                alt="Platzhalter"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
