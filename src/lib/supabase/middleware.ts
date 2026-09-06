import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";
import { getUserRole } from "@/lib/require-admin";

const SELLER_PREFIXES = ["/dashboard"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_REQUIRED_PREFIXES = ["/account", "/cart", "/chat", ...SELLER_PREFIXES, ...ADMIN_PREFIXES];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // IMPORTANT: this call must happen so the auth token is refreshed on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = AUTH_REQUIRED_PREFIXES.some((p) => path.startsWith(p));

  if (needsAuth && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Route-level role gating. This is a UX convenience only — the real
  // authorization boundary is enforced by Postgres RLS policies, per
  // spec section 38 ("never rely only on frontend permissions").
  if (user && (SELLER_PREFIXES.some((p) => path.startsWith(p)) || ADMIN_PREFIXES.some((p) => path.startsWith(p)))) {
    const role = await getUserRole(supabase, user.id);

    if (ADMIN_PREFIXES.some((p) => path.startsWith(p)) && role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (SELLER_PREFIXES.some((p) => path.startsWith(p)) && role !== "seller" && role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}
