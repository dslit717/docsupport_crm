import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
  generateSlug,
  updateRelations,
} from "@/lib/server/api-utils";

// GET: 특정 업체 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("vendors")
      .select(
        `
        *,
        vendor_category_map (
          vendor_categories (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return createErrorResponse(error, 404, "업체를 찾을 수 없습니다.");
    }

    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error, 500, "업체 조회 오류");
  }
}

// PUT: 업체 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin 클라이언트 사용 (RLS 우회)
    const supabase = createSupabaseAdminClient();
    const { id } = await params;
    const body = await request.json();

    console.log("[업체 수정 요청]", { id, body });

    const {
      name,
      category_ids,
      ...vendorFields
    } = body;

    // 업데이트할 데이터 준비 - undefined 값 제거
    const cleanedFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(vendorFields)) {
      if (value !== undefined) {
        cleanedFields[key] = value;
      }
    }

    let updateData: any = {
      ...cleanedFields,
      updated_at: new Date().toISOString(),
    };

    // 슬러그 업데이트 (이름이 변경된 경우)
    if (name) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }

    console.log("[업체 수정 데이터]", { id, updateData });

    // 업체 정보 업데이트
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (vendorError) {
      console.error("[업체 수정 오류]", vendorError);
      return NextResponse.json(
        {
          success: false,
          error: "업체 수정 오류",
          details: vendorError.message,
          code: vendorError.code,
          hint: vendorError.hint,
          debug: {
            update_data: updateData,
            vendor_id: id,
          },
        },
        { status: 400 }
      );
    }

    // 카테고리 연결 업데이트
    if (category_ids !== undefined) {
      try {
        await updateRelations(
          supabase,
          id,
          category_ids,
          "vendor_category_map",
          "vendor_id",
          "category_id"
        );
      } catch (categoryError: any) {
        console.error("[카테고리 연결 오류]", categoryError);
        // 카테고리 연결 실패해도 업체 수정은 성공으로 처리
      }
    }

    console.log("[업체 수정 성공]", { id, vendor_name: vendor.name });
    return createSuccessResponse(vendor);
  } catch (error: any) {
    console.error("[업체 수정 예외]", error);
    return NextResponse.json(
      {
        success: false,
        error: "업체 수정 오류",
        details: error?.message || String(error),
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE: 업체 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // 관련 데이터 삭제 (CASCADE가 없는 경우를 대비)
    await Promise.all([
      supabase.from("vendor_category_map").delete().eq("vendor_id", id),
    ]);

    // 업체 삭제
    const { error } = await supabase.from("vendors").delete().eq("id", id);

    if (error) {
      return createErrorResponse(error, 400, "업체 삭제 오류");
    }

    return NextResponse.json({ message: "업체가 삭제되었습니다." });
  } catch (error) {
    return createErrorResponse(error, 500, "업체 삭제 오류");
  }
}
