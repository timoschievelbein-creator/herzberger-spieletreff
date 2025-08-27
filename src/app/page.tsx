import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { publicImageUrl } from "@/lib/public-helpers";
import SearchFilters from "@/components/SearchFilters";
import SortSelect from "@/components/SortSelect";

const PAGE_SIZE = 12;

function one(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v ?? "";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const q = one(sp.q).trim();
  const page = Math.max(1, parseInt(one(sp.page) || "1", 10) || 1);
  const sort = one(sp.sort) || "title_asc";

  // Spieler-Filter: "2", "3", "4", "5", "6plus"
  const players = one(sp.players);

  const sb = await supabaseServer();

  let query = sb
    .from("games")
    .select("id, title, bgg_rating, status, loaned_to, created_at", {
      count: "exact",
    });

  if (q) query = query.ilike("title", `%${q}%`);

  // Spielerfilter anwenden (max_players vorausgesetzt)
  if (players === "6plus") {
    query = query.gte("max_players", 6);
  } else if (["2", "3", "4", "5"].includes(players)) {
    query = query.lte("max_players", Number(players));
  }

  // Sortierung
  switch (sort) {
    case "title_desc":
      query = query.order("title", { ascending: false });
      break;
    case "rating_desc":
      query = query.order("bgg_rating", { ascending: false, nullsFirst: false });
      break;
    case "rating_asc":
      query = query.order("bgg_rating", { ascending: true, nullsFirst: true });
      break;
    case "created_desc":
      query = query.order("created_at", { ascending: false });
      break;
    case "created_asc":
      query = query.order("created_at", { ascending: true });
      break;
    default:
      query = query.order("title", { ascending: true });
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: games, count } = await query.range(from, to);

  const ids = games?.map((g: any) => g.id) ?? [];
  const { data: covers } = ids.length
    ? await sb
        .from("game_images")
        .select("game_id, storage_path, is_cover")
        .in("game_id", ids)
        .eq("is_cover", true)
    : { data: [] as any[] };

  const lastPage = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const baseParams: Record<string, string | undefined> = {
    q,
    sort,
    players: players || undefined,
  };

  const hrefPage = (p: number) => {
    const ps = new URLSearchParams(
      Object.entries({ ...baseParams, page: String(p) }).filter(([, v]) => v)
    );
    return `/?${ps.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Zeile 1: Suche (links) + Sortierung (rechts) */}
<div className="flex flex-wrap items-start justify-between gap-3">
  <div className="flex-1 min-w-0">
    <SearchFilters />
  </div>
  <div className="shrink-0 self-start">
    <SortSelect value={sort} params={{ ...baseParams, page: String(page) }} />
  </div>
</div>

      {/* Karten */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games?.map((g: any) => {
          const cover = covers?.find((c) => c.game_id === g.id)?.storage_path;
          const img = cover ? publicImageUrl(cover) : "/placeholder-game.jpg";
          return (
            <Link key={g.id} href={`/games/${g.id}`} className="group block no-underline">
              <div className="aspect-[4/5] bg-white border rounded-xl overflow-hidden">
                <img
                  src={img}
                  alt={g.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <div className="mt-2">
                <div className="font-semibold truncate">{g.title}</div>
                <div className="text-sm text-slate-600">
                  BGG: {g.bgg_rating ?? "–"}{" "}
                  {g.status === "archived" && <span className="ml-2">(archiviert)</span>}
                  {g.loaned_to && <span className="ml-2">· verliehen</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-2">
          <Link className="btn" href={hrefPage(Math.max(1, page - 1))} aria-disabled={page === 1}>
            ← Zurück
          </Link>

          {Array.from({ length: lastPage }).map((_, i) => {
            const p = i + 1;
            const active = p === page;
            return (
              <Link
                key={p}
                href={hrefPage(p)}
                className={`px-3 py-1 rounded border ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-white dark:bg-slate-800"
                }`}
              >
                {p}
              </Link>
            );
          })}

          <Link
            className="btn"
            href={hrefPage(Math.min(lastPage, page + 1))}
            aria-disabled={page === lastPage}
          >
            Weiter →
          </Link>
        </nav>
      )}
    </div>
  );
}
