import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET: 특정 카테고리 조회 (연결된 업체 목록 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { id } = params;

    // 카테고리 정보 조회
    const { data: category, error: categoryError } = await supabase
      .from("vendor_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (categoryError) {
      console.error("카테고리 조회 오류:", categoryError);
      return NextResponse.json(
        { error: categoryError.message },
        { status: 404 }
      );
    }

    // 연결된 업체 목록 조회
    const { data: vendorMaps, error: mapError } = await supabase
      .from("vendor_category_map")
      .select(
        `
        vendor_id,
        vendors (
          id,
          name,
          phone,
          email,
          city,
          state,
          status
        )
      `
      )
      .eq("category_id", id);

    if (mapError) {
      console.error("업체 매핑 조회 오류:", mapError);
    }

    const vendors = vendorMaps?.map((map: any) => map.vendors) || [];

    return NextResponse.json({
      data: {
        ...category,
        vendors,
      },
    });
  } catch (error) {
    console.error("카테고리 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 카테고리 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { id } = params;
    const body = await request.json();

    const { name, description, is_active } = body;

    // 업데이트 데이터 준비
    let updateData: any = {
      description,
      is_active,
      updated_at: new Date().toISOString(),
    };

    // 이름이 변경된 경우 슬러그도 업데이트
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      updateData.name = name;
      updateData.slug = slug;
    }

    // 카테고리 업데이트
    const { data, error } = await supabase
      .from("vendor_categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("카테고리 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("카테고리 수정 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    // 인증된 사용자는 Server 클라이언트로 충분 (RLS 정책이 인증된 사용자 허용)
    const supabase = await createSupabaseServerClient();
    const { id } = params;

    // 연결된 업체의 카테고리 매핑 삭제 (미지정으로 변경)
    const { error: mapError } = await supabase
      .from("vendor_category_map")
      .delete()
      .eq("category_id", id);

    if (mapError) {
      console.error("카테고리 매핑 삭제 오류:", mapError);
      return NextResponse.json({ error: mapError.message }, { status: 400 });
    }

    // 카테고리 삭제
    const { error } = await supabase
      .from("vendor_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("카테고리 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "카테고리가 삭제되고 연결된 업체가 미지정으로 변경되었습니다.",
    });
  } catch (error) {
    console.error("카테고리 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
