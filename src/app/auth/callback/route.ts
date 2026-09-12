import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both:
//  - email confirmation links (signup)
//  - password recovery links (forgot-password)
//  - OAuth (Google) sign-in redirects
// Supabase/Google sends the user here with a `code` query param on
// success, or an `error` param if the OAuth flow itself failed (denied
// access, misconfigured provider, etc.) — both are handled explicitly so
// a failure lands back on the login page with a clear message instead of
// silently redirecting as if nothing went wrong.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
