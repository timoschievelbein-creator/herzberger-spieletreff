"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";


type Row = { player_name: string; score?: number | null; position?: number | null };

export default function AddPlay({ gameId }: { gameId: string }) {
  const [playedAt, setPlayedAt] = useState<string>(new Date().toISOString().slice(0,10));
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([{ player_name: "" }, { player_name: "" }]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const updateRow = (i: number, k: keyof Row, v: any) =>
    setRows(r => r.map((x,idx)=> idx===i ? { ...x, [k]: v } : x));

  const addRow = () => setRows(r => [...r, { player_name: "" }]);
  const removeRow = (i: number) => setRows(r => r.filter((_,idx)=>idx!==i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const sb = supabaseBrowser();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) { setErr("Bitte einloggen."); setBusy(false); return; }

    const { data: play, error } = await sb.from("plays").insert({
      game_id: gameId,
      played_at: playedAt,
      location: location || null,
      notes: notes || null,
      created_by: auth.user.id
    }).select("id").single();
    if (error) { setErr(error.message); setBusy(false); return; }

    const payload = rows
      .filter(r => r.player_name.trim().length)
      .map((r,i)=>({
        play_id: play!.id,
        player_name: r.player_name.trim(),
        score: r.score ?? null,
        position: r.position ?? i+1
      }));

    if (payload.length) {
      const { error: e2 } = await sb.from("play_results").insert(payload);
      if (e2) { setErr(e2.message); setBusy(false); return; }
    }

    setBusy(false);
    window.location.reload();
  };

  return (
    <form onSubmit={submit} className="space-y-3 mt-2">
      <div className="grid md:grid-cols-3 gap-2">
        <div>
          <label className="block text-sm mb-1">Datum</label>
          <input className="input" type="date" value={playedAt} onChange={e=>setPlayedAt(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Ort</label>
          <input className="input" value={location} onChange={e=>setLocation(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Notiz</label>
          <input className="input" value={notes} onChange={e=>setNotes(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Spieler & Ergebnisse</div>
        {rows.map((r,i)=>(
          <div key={i} className="grid grid-cols-12 gap-2">
            <input className="input col-span-6" placeholder="Name"
                   value={r.player_name} onChange={e=>updateRow(i,"player_name",e.target.value)} />
            <input className="input col-span-3" placeholder="Punkte" type="number"
                   value={r.score ?? ""} onChange={e=>updateRow(i,"score",e.target.value === "" ? null : Number(e.target.value))}/>
            <input className="input col-span-2" placeholder="Platz" type="number"
                   value={r.position ?? ""} onChange={e=>updateRow(i,"position",e.target.value === "" ? null : Number(e.target.value))}/>
            <button type="button" className="btn col-span-1" onClick={()=>removeRow(i)}>–</button>
          </div>
        ))}
        <button type="button" className="btn" onClick={addRow}>+ Spieler</button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}
      <button className="btn">Ergebnis speichern</button>
    </form>
  );
}
