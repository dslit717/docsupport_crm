import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/server/api-utils";

/**
 * GET - 연락처 총 개수 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const productId = searchParams.get("product_id") || "";

    let query = supabase
      .from("beauty_product_contacts_map_uuid")
      .select(`
        id,
        beauty_products!inner(ProductName, ProductManufacturer),
        beauty_product_contacts!inner(company_name_ko, company_name_en)
      `, { count: "exact", head: true });

    // 검색 필터
    if (search) {
      query = query.or(
        `beauty_products.ProductName.ilike.%${search}%,` +
        `beauty_products.ProductManufacturer.ilike.%${search}%,` +
        `beauty_product_contacts.company_name_ko.ilike.%${search}%,` +
        `beauty_product_contacts.company_name_en.ilike.%${search}%`
      );
    }

    // 특정 제품 필터
    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처 개수 조회 오류");
  }
}

