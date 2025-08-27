import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Supabase-Client für Server Components (nur lesen) */
export async function supabaseServer() {
  const cookieStore = await cookies(); // Next 15: cookies() ist async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // In RSC nicht schreiben
        set() {},
        remove() {},
      },
    }
  );
}

/** Supabase-Client für Server Actions / Route Handler (lesen + schreiben) */
export async function supabaseServerAction() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, expires: new Date(0) });
        },
      },
    }
  );
}
