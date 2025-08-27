"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";


export default function AddComment({ gameId }: { gameId: string }) {
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const sb = supabaseBrowser();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) { setErr("Bitte einloggen."); setBusy(false); return; }

    const { error } = await sb.from("comments").insert({
      game_id: gameId, body: body.trim(), created_by: auth.user.id
    });
    if (error) setErr(error.message);
    else setBody("");
    setBusy(false);
    if (!error) window.location.reload();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 mt-2">
      <textarea className="input" rows={3} placeholder="Kommentar…" value={body}
                onChange={(e)=>setBody(e.target.value)} />
      {err && <div className="text-sm text-red-600">{err}</div>}
      <button className="btn self-start" disabled={busy || !body.trim()}>Kommentar speichern</button>
    </form>
  );
}
