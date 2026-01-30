import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET: 특정 카테고리의 업체 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { categoryId } = params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isAdvertisement = searchParams.get("is_advertisement");
    const sortField = searchParams.get("sortField") || "priority_score";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    let query = supabase
      .from("vendors")
      .select(
        `
        *,
        vendor_categories(
          id,
          name,
          slug
        )
      `,
        { count: "exact" }
      )
      .eq("category_id", categoryId)
      .order(sortField, { ascending: sortDirection === "asc" });

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

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 데이터와 총 개수를 함께 조회
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("카테고리별 업체 목록 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("카테고리별 업체 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
