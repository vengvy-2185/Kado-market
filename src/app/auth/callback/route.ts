import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both:
//  - email confirmation links (signup)
//  - password recovery links (forgot-password)
// Supabase sends the user here with a `code` query param; we exchange it
// for a session, then continue on to `next` (defaults to home).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
