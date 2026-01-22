import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(
        name: string,
        value: string,
        options: Parameters<typeof response.cookies.set>[2]
      ) {
        response.cookies.set(name, value, options);
      },
      remove(
        name: string,
        options: Parameters<typeof response.cookies.set>[2]
      ) {
        response.cookies.set(name, "", options);
      },
    },
  });

  const { data } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } as any }));
  const session = data?.user ? { user: data.user } : null;

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isApi = pathname.startsWith("/api");
  const isAuth = pathname.startsWith("/auth");
  const isManagerApi = pathname.startsWith("/manager-api");
  const isManager = pathname.startsWith("/manager");

  // 로그인 없이 접근 가능한 공개 페이지들
  const publicPages = [
    "/",
  ];
  const isPublicPage = publicPages.some((page) => pathname === page);

  // Manager API는 인증 필수
  if (isManagerApi && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Manager 페이지는 인증 필수
  if (isManager && !isLogin && !session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인 페이지에 이미 인증된 경우 홈으로 리다이렉트
  if (isLogin && session) {
    return NextResponse.redirect(new URL("/manager", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};

