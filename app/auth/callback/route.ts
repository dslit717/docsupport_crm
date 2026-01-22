/**
 * OAuth 인증 콜백 핸들러
 *
 * 이 파일은 Supabase OAuth 인증 흐름의 콜백을 처리합니다.
 * 카카오, 구글 등 소셜 로그인 후 사용자가 리다이렉트되는 엔드포인트입니다.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code"); 
  const next = url.searchParams.get("redirectedFrom") || "/manager";

  console.log("Auth callback - Code:", code ? "존재" : "없음");
  console.log("Auth callback - Redirect to:", next);

  const origin = url.origin;
  const response = NextResponse.redirect(new URL(next, origin));

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("Session exchange:", {
        success: !!data.session,
        user: data.session?.user?.email,
        error: error?.message,
      });

      if (error) {
        console.error("Session exchange error:", error);
      }
    } catch (err) {
      console.error("Unexpected error during session exchange:", err);
    }
  }

  return response;
}

