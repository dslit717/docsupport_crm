import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

/**
 * GET: 특정 유저 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // user_management_view에서 조회
    const { data, error } = await supabase
      .from("user_management_view")
      .select("*")
      .eq("id", id)
      .single();

    console.log("[유저 조회] 결과:", { data: !!data, error: error?.message });

    if (error) {
      console.error("[유저 조회] DB 오류:", error);
      return createErrorResponse(error, 404, "유저 조회 오류");
    }

    if (!data) {
      return createErrorResponse(
        new Error("유저를 찾을 수 없습니다."),
        404
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    console.error("[유저 조회] 예외 발생:", error);
    return createErrorResponse(error, 500, "유저 조회 오류");
  }
}

/**
 * PATCH: 유저 정보 수정 (의사 인증 상태 등)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    console.log("[유저 업데이트] 요청 데이터:", body);

    // 업데이트 가능한 필드
    const { is_doctor_verified, is_active, role } = body;

    // users 테이블 업데이트
    const usersUpdate: Record<string, any> = {};
    if (is_active !== undefined) usersUpdate.is_active = is_active;
    if (role !== undefined) usersUpdate.role = role;

    if (Object.keys(usersUpdate).length > 0) {
      usersUpdate.updated_at = new Date().toISOString();
      const { error: usersError } = await supabase
        .from("users")
        .update(usersUpdate)
        .eq("id", id);

      if (usersError) {
        console.error("users 테이블 업데이트 오류:", usersError);
        return createErrorResponse(usersError, 500, "유저 정보 업데이트 오류");
      }
    }

    // user_info 테이블 업데이트 (의사 인증 상태)
    if (is_doctor_verified !== undefined) {
      // user_info 레코드 존재 확인
      const { data: existingInfo } = await supabase
        .from("user_info")
        .select("id")
        .eq("user_id", id)
        .single();

      if (existingInfo) {
        // 기존 레코드 업데이트
        const { error: infoError } = await supabase
          .from("user_info")
          .update({
            is_doctor_verified,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", id);

        if (infoError) {
          console.error("user_info 테이블 업데이트 오류:", infoError);
          return createErrorResponse(infoError, 500, "의사 인증 상태 업데이트 오류");
        }
      } else {
        // 새 레코드 생성
        const { error: insertError } = await supabase
          .from("user_info")
          .insert({
            user_id: id,
            is_doctor_verified,
          });

        if (insertError) {
          console.error("user_info 레코드 생성 오류:", insertError);
          return createErrorResponse(insertError, 500, "의사 인증 상태 생성 오류");
        }
      }
    }

    // 업데이트된 정보 조회
    const { data: updatedUser, error: fetchError } = await supabase
      .from("user_management_view")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return createSuccessResponse({ message: "유저 정보가 업데이트되었습니다." });
    }

    return createSuccessResponse({
      message: "유저 정보가 업데이트되었습니다.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("유저 업데이트 오류:", error);
    return createErrorResponse(error, 500, "유저 업데이트 오류");
  }
}

