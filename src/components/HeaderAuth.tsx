import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";

export default async function HeaderAuth() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="hover:underline">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm opacity-80">{user.email}</span>
      <Link href="/logout" className="hover:underline">
        Logout
      </Link>
    </div>
  );
}
