// src/lib/public-helpers.ts
import { createClient } from "@supabase/supabase-js";

// einen kleinen Client nur für Storage-URLs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Falls dein Bucket anders heißt -> hier anpassen!
const BUCKET = "game-images";

export function publicImageUrl(path: string) {
  // nutzt die offizielle getPublicUrl-API (funktioniert auch bei CDN/Region-Änderungen)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
