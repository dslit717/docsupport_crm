import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET: 필터된 업체 개수 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isAdvertisement = searchParams.get("is_advertisement");
    const categoryId = searchParams.get("category_id");

    let query = supabase
      .from("vendors")
      .select("*", { count: "exact", head: true });

    // 검색 필터
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description_md.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 광고 상태 필터 (만료 날짜로 체크)
    if (isAdvertisement !== null && isAdvertisement !== "") {
      const now = new Date().toISOString();
      if (isAdvertisement === "true") {
        // 활성 광고: 만료 날짜가 현재 시간보다 이후
        query = query.gt("advertisement_expires_at", now);
      } else {
        // 비활성 광고: 만료 날짜가 현재 시간보다 이전이거나 null
        query = query.or(
          `advertisement_expires_at.lt.${now},advertisement_expires_at.is.null`
        );
      }
    }

    // 카테고리 필터
    if (categoryId) {
      // vendor_category_map을 통해 해당 카테고리에 속한 업체 ID들을 조회
      const { data: categoryVendors, error: categoryError } = await supabase
        .from("vendor_category_map")
        .select("vendor_id")
        .eq("category_id", categoryId);

      if (categoryError) {
        console.error("카테고리 업체 조회 오류:", categoryError);
        return NextResponse.json(
          { error: categoryError.message },
          { status: 400 }
        );
      }

      const vendorIds = categoryVendors?.map((item) => item.vendor_id) || [];

      if (vendorIds.length === 0) {
        // 해당 카테고리에 속한 업체가 없으면 0 반환
        return NextResponse.json({ count: 0 });
      }

      // 해당 업체 ID들로 필터링
      query = query.in("id", vendorIds);
    }

    const { count, error } = await query;

    if (error) {
      console.error("개수 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Count API 응답:", count);
    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("개수 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
