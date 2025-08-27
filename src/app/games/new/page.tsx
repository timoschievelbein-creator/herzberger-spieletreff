import { supabaseServer } from "@/lib/supabase-server";
import GameForm from "@/components/GameForm";
import Link from "next/link";

export const metadata = { title: "Neues Spiel – Herzberger Spieletreff" };

export default async function NewGamePage() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();

  if (!data.user) {
    return (
      <div className="max-w-3xl mx-auto card">
        Bitte <Link className="underline" href="/login">einloggen</Link>, um Spiele anzulegen.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Neues Spiel</h1>
      <GameForm />
    </div>
  );
}
