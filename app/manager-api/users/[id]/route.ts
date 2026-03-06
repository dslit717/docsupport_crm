import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

/** GET: 특정 유저 상세 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_management_view")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return createErrorResponse(error ?? new Error("유저를 찾을 수 없습니다."), 404, "유저 조회 오류");
  }
  return createSuccessResponse(data);
}

/** PATCH: 유저 정보 수정 (의사 인증 상태 등) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const supabase = await createSupabaseAdminClient();
    const body = await request.json();
    const { is_doctor_verified, is_active, role } = body;

    // users 테이블 업데이트
    const usersUpdate: Record<string, unknown> = {};
    if (is_active !== undefined) usersUpdate.is_active = is_active;
    if (role !== undefined) usersUpdate.role = role;
    if (Object.keys(usersUpdate).length > 0) {
      usersUpdate.updated_at = new Date().toISOString();
      const { error: usersError } = await supabase.from("users").update(usersUpdate).eq("id", id);
      if (usersError) return createErrorResponse(usersError, 500, "유저 정보 업데이트 오류");
    }

    // user_info 업데이트 (의사 인증)
    let shouldSendWelcomeMessage = false;
    if (is_doctor_verified !== undefined) {
      const { data: existingInfo } = await supabase
        .from("user_info")
        .select("is_doctor_verified")
        .eq("user_id", id)
        .single();

      const wasNotVerified = !existingInfo?.is_doctor_verified;
      const infoPayload = { is_doctor_verified, updated_at: new Date().toISOString() };

      if (existingInfo) {
        const { error: infoError } = await supabase
          .from("user_info")
          .update(infoPayload)
          .eq("user_id", id);
        if (infoError) return createErrorResponse(infoError, 500, "의사 인증 상태 업데이트 오류");
      } else {
        const { error: insertError } = await supabase
          .from("user_info")
          .insert({ user_id: id, is_doctor_verified });
        if (insertError) return createErrorResponse(insertError, 500, "의사 인증 상태 생성 오류");
      }
      shouldSendWelcomeMessage = is_doctor_verified === true && wasNotVerified;
    }

    // 의사 인증 승인 시 환영 카카오톡 발송 (백그라운드, PATCH 응답 블로킹 안 함)
    if (shouldSendWelcomeMessage) {
      const apiUrl = `${process.env.DOCSUPPORT_SITE_URL || "https://docsupport.kr"}/api/admin/approve-doctor`;
      const adminKey = process.env.BLOG_ADMIN_API_KEY;
      if (adminKey) {
        fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ user_id: id }),
        }).catch(() => {});
      }
    }

    const { data: updatedUser } = await supabase
      .from("user_management_view")
      .select("*")
      .eq("id", id)
      .single();

    return createSuccessResponse({
      message: "유저 정보가 업데이트되었습니다.",
      data: updatedUser ?? undefined,
    });
  } catch (error) {
    return createErrorResponse(error, 500, "유저 업데이트 오류");
  }
}

