import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
  parsePaginationParams,
  parseSortParams,
  QueryBuilder,
  fetchItemsWithCategories,
  applyCategoryFilter,
  generateSlug,
  validateRequiredFields,
  updateRelations,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET: 업체 목록 조회 (vendors_with_categories 뷰 활용)
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // 파라미터 파싱
    const { page, limit } = parsePaginationParams(searchParams);
    const { sortField, sortDirection } = parseSortParams(
      searchParams,
      "priority_score",
      "desc"
    );
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isAdvertisement = searchParams.get("is_advertisement");
    const categoryId = searchParams.get("category_id");

    // vendors_with_categories 뷰 사용 (단일 쿼리로 카테고리 포함)
    let query = supabase.from("vendors_with_categories").select("*");

    // 카테고리 필터
    if (categoryId) {
      // categories 컬럼에서 해당 카테고리 ID를 포함하는 행 필터링
      query = query.filter("categories", "cs", `[{"id":"${categoryId}"}]`);
    }

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

    // 광고 필터
    if (isAdvertisement) {
      const now = new Date().toISOString();
      if (isAdvertisement === "true") {
        query = query.gt("advertisement_expires_at", now);
      } else {
        query = query.or(
          `advertisement_expires_at.lt.${now},advertisement_expires_at.is.null`
        );
      }
    }

    // 정렬
    query = query.order(sortField, { ascending: sortDirection === "asc" });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      return createErrorResponse(error, 400);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return createErrorResponse(error, 500, "업체 목록 조회 오류");
  }
}

// POST: 새 업체 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const {
      name,
      description_md,
      phone,
      mobile,
      email,
      website,
      address,
      service_areas,
      business_hours,
      kakao_channel,
      consultation_url,
      is_certified = false,
      highlight_badge,
      priority_score = 0,
      advertisement_tier = "none",
      advertisement_image_url,
      advertisement_expires_at,
      category_ids = [],
    } = body;

    // 필수 필드 검증
    const validation = validateRequiredFields(body, ["name"]);
    if (!validation.valid) {
      return createErrorResponse(
        new Error(`필수 필드 누락: ${validation.missing?.join(", ")}`),
        400
      );
    }

    // 슬러그 생성
    const slug = generateSlug(name);

    // 업체 생성
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        name,
        slug,
        description_md,
        phone,
        mobile,
        email,
        website,
        address,
        service_areas,
        business_hours,
        kakao_channel,
        consultation_url,
        is_certified,
        highlight_badge,
        priority_score,
        advertisement_tier,
        advertisement_image_url,
        advertisement_expires_at,
        status: "published",
      })
      .select()
      .single();

    if (vendorError) {
      return createErrorResponse(vendorError, 400, "업체 생성 오류");
    }

    // 카테고리 연결
    if (category_ids.length > 0) {
      await updateRelations(
        supabase,
        vendor.id,
        category_ids,
        "vendor_category_map",
        "vendor_id",
        "category_id"
      );
    }

    return createSuccessResponse(vendor, 201);
  } catch (error) {
    return createErrorResponse(error, 500, "업체 생성 오류");
  }
}
