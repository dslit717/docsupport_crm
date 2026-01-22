/**
 * Manager API 인증 유틸리티
 *
 * 인증된 사용자만 접근할 수 있도록 체크
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * 인증된 사용자인지 확인
 * @returns { user: User | null, error: NextResponse | null }
 */
export async function checkAuth() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "인증이 필요합니다.", code: "UNAUTHORIZED" },
          { status: 401 }
        ),
      };
    }

    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "인증 확인 중 오류가 발생했습니다.", details: error.message },
        { status: 500 }
      ),
    };
  }
}

/**
 * 관리자 권한이 있는지 확인
 * 현재는 모든 인증된 사용자가 접근 가능
 * 필요시 role 체크 로직 추가 가능
 */
export async function checkAdminAuth() {
  const authResult = await checkAuth();
  if (authResult.error) {
    return authResult;
  }

  // TODO: 필요시 role 체크 로직 추가
  // const supabase = await createSupabaseServerClient();
  // const { data: profile } = await supabase
  //   .from("user_profiles")
  //   .select("role")
  //   .eq("id", authResult.user.id)
  //   .single();
  //
  // if (profile?.role !== "admin") {
  //   return {
  //     user: null,
  //     error: NextResponse.json(
  //       { error: "관리자 권한이 필요합니다." },
  //       { status: 403 }
  //     ),
  //   };
  // }

  return authResult;
}

