import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseConfigured =
  supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://");

// Mieter subdomain rewrite map: clean URL → internal /mieter/* path
const MIETER_REWRITES: Record<string, string> = {
  "/":             "/mieter/dashboard",
  "/dashboard":    "/mieter/dashboard",
  "/miete":        "/mieter/miete",
  "/dokumente":    "/mieter/dokumente",
  "/zaehler":      "/mieter/zaehler",
  "/anfragen":     "/mieter/anfragen",
  "/anfragen/neu": "/mieter/anfragen/neu",
  "/nachrichten":  "/mieter/nachrichten",
  "/login":        "/mieter/login",
};

export async function middleware(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next({ request });

  const hostname = request.headers.get("host") ?? "";
  const isMieterSubdomain =
    hostname.startsWith("mieter.") ||
    hostname === "mieter.imvestra.de" ||
    hostname === "mieter.www.imvestra.de";

  // ── Subdomain rewrite ──────────────────────────────────────────────────────
  if (isMieterSubdomain) {
    const pathname = request.nextUrl.pathname;

    // Activation link: mieter.imvestra.de/aktivieren/[code] → /mieter/aktivieren/[code]
    if (pathname.startsWith("/aktivieren/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/mieter${pathname}`;
      return NextResponse.rewrite(url);
    }

    const target = MIETER_REWRITES[pathname];
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.rewrite(url);
    }

    // Unknown path on mieter subdomain → rewrite as /mieter/[path]
    if (!pathname.startsWith("/mieter/") && !pathname.startsWith("/_next")) {
      const url = request.nextUrl.clone();
      url.pathname = `/mieter${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Auth checks (main domain) ──────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Mieter-portal public pages (no auth required)
  const isMieterAuthPage = pathname.startsWith("/mieter/login") || pathname.startsWith("/mieter/aktivieren");

  // Mieter-portal protected pages (require mieter auth)
  const isMieterPortal = pathname.startsWith("/mieter/") && !isMieterAuthPage;

  // Vermieter dashboard routes (require vermieter auth)
  const isDashboard = pathname === "/mieter" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/calculator") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/pdf-export") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/standort") ||
    pathname.startsWith("/finanzen") ||
    pathname.startsWith("/aufgaben") ||
    pathname.startsWith("/anfragen") ||
    pathname.startsWith("/steuern") ||
    pathname.startsWith("/verhandlung") ||
    pathname.startsWith("/dokumente") ||
    pathname.startsWith("/mahnwesen") ||
    pathname.startsWith("/nebenkostenabrechnung") ||
    pathname.startsWith("/mietvertraege") ||
    pathname.startsWith("/uebergabe") ||
    pathname.startsWith("/bewerber") ||
    pathname.startsWith("/jahresabrechnung") ||
    pathname.startsWith("/instandhaltung") ||
    pathname.startsWith("/bank");

  if (isDashboard && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isMieterPortal && !user) {
    return NextResponse.redirect(new URL("/mieter/login", request.url));
  }

  if (isAuthPage && user) {
    const isMieter = user.user_metadata?.role === "mieter";
    return NextResponse.redirect(new URL(isMieter ? "/mieter/dashboard" : "/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|api).*)"],
};
