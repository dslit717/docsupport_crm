import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST: 카테고리에 업체 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id: categoryId } = params;
    const body = await request.json();

    const { vendor_ids } = body;

    if (!vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
      return NextResponse.json(
        { error: "업체 ID 목록이 필요합니다." },
        { status: 400 }
      );
    }

    // 매핑 데이터 생성
    const mappings = vendor_ids.map((vendorId: string) => ({
      category_id: categoryId,
      vendor_id: vendorId,
    }));

    // 중복 체크 후 삽입
    const { data, error } = await supabase
      .from("vendor_category_map")
      .upsert(mappings, { onConflict: "category_id,vendor_id" })
      .select();

    if (error) {
      console.error("업체 추가 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: `${vendor_ids.length}개의 업체가 추가되었습니다.`,
    });
  } catch (error) {
    console.error("업체 추가 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 카테고리에서 업체 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id: categoryId } = params;
    const { searchParams } = new URL(request.url);

    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json(
        { error: "업체 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 매핑 삭제
    const { error } = await supabase
      .from("vendor_category_map")
      .delete()
      .eq("category_id", categoryId)
      .eq("vendor_id", vendorId);

    if (error) {
      console.error("업체 제거 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "카테고리에서 업체가 제거되었습니다.",
    });
  } catch (error) {
    console.error("업체 제거 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
