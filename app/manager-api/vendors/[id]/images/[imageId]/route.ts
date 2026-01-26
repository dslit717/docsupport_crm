import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/server/api-utils";

// PUT: 이미지 정보 업데이트 (대표 이미지 설정 등)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const { id: vendorId, imageId } = await params;
    const body = await request.json();

    // is_primary가 true로 설정되는 경우, 다른 이미지들의 is_primary를 false로 설정
    if (body.is_primary === true) {
      await supabase
        .from("vendor_images")
        .update({ is_primary: false })
        .eq("vendor_id", vendorId);
    }

    // 이미지 정보 업데이트
    const { data, error } = await supabase
      .from("vendor_images")
      .update(body)
      .eq("id", imageId)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 400, "이미지 업데이트 오류");
    }

    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error, 500, "이미지 업데이트 오류");
  }
}

