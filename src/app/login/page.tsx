"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const sb = supabaseBrowser();

  const send = async () => {
    setMsg(null);
    const redirectTo = `${location.origin}/auth/callback`;
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setMsg(error ? error.message : "Mail gesendet – bitte Posteingang prüfen.");
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input
        className="input w-full mb-3"
        placeholder="du@example.de"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn" onClick={send} disabled={!email}>
        Magic-Link senden
      </button>
      {msg && <p className="text-sm mt-3">{msg}</p>}
    </div>
  );
}
