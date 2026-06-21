import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseConfigured =
  supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://");

export async function middleware(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next({ request });

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
