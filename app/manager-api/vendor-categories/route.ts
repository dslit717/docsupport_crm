import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
  parseSortParams,
  QueryBuilder,
  generateSlug,
  validateRequiredFields,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET: 카테고리 목록 조회 (연결된 업체 수 포함)
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const { sortField, sortDirection } = parseSortParams(searchParams, "name", "asc");

    // 카테고리 조회
    const queryBuilder = new QueryBuilder(
      supabase.from("vendor_categories").select("*")
    );

    queryBuilder
      .search(search, ["name", "slug"])
      .sort(sortField, sortDirection);

    const { data: categories, error } = await queryBuilder.execute();

    if (error) {
      return createErrorResponse(error, 400, "카테고리 조회 오류");
    }

    // 각 카테고리별 연결된 업체 수 조회
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from("vendor_category_map")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id);

        return {
          ...category,
          vendor_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      data: categoriesWithCount,
      total: categoriesWithCount.length,
    });
  } catch (error) {
    return createErrorResponse(error, 500, "카테고리 목록 조회 오류");
  }
}

// POST: 새 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const body = await request.json();

    // 필수 필드 검증
    const validation = validateRequiredFields(body, ["name"]);
    if (!validation.valid) {
      return createErrorResponse(
        new Error(`필수 필드 누락: ${validation.missing?.join(", ")}`),
        400
      );
    }

    // 슬러그 생성
    const slug = generateSlug(body.name);

    // 카테고리 생성
    const { data, error } = await supabase
      .from("vendor_categories")
      .insert({
        name: body.name,
        slug,
        description: body.description,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 400, "카테고리 생성 오류");
    }

    return createSuccessResponse(data, 201);
  } catch (error) {
    return createErrorResponse(error, 500, "카테고리 생성 오류");
  }
}
