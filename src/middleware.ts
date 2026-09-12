import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - public asset extensions
     * - /auth/callback — this is a one-time OAuth/email-link code exchange.
     *   Running the session-refresh middleware on it too can race with the
     *   route handler's own exchangeCodeForSession call, consuming the
     *   single-use PKCE code twice and causing a
     *   "flow_state_already_used" error on the second attempt.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
