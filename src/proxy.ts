import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/entrar";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) {
    throw new Error("Variável de ambiente ausente: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Variável de ambiente ausente: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Validates the JWT with Supabase and refreshes the session cookies if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === LOGIN_PATH;

  // Fixture previews (no data access) are reachable without a session in dev only.
  const isDevPreview =
    process.env.NODE_ENV === "development" && pathname.startsWith("/dev/");

  let redirectTo: string | null = null;
  if (!user && !isLogin && !isDevPreview) redirectTo = LOGIN_PATH;
  else if (user && isLogin) redirectTo = "/";

  if (redirectTo) {
    const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
    // Keep any refreshed auth cookies on the redirect response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith("cache-control")) redirect.headers.set(key, value);
    });
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\.ico|icon-[^/]+\.png|apple-touch-icon\.png|manifest\.webmanifest).*)",
  ],
};
