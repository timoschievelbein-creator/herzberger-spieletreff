"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const r = useRouter();
  return (
    <button
      className="header-link"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        r.refresh();
      }}
    >
      Logout
    </button>
  );
}
