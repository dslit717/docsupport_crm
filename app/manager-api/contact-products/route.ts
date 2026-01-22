import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/server/api-utils";

/**
 * GET - 연락처별 제품 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "company_name_ko";
    const sortDirection = (searchParams.get("sortDirection") || "asc") as "asc" | "desc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 먼저 연락처 목록을 가져옴
    let contactQuery = supabase
      .from("beauty_product_contacts")
      .select("*", { count: "exact" });

    // 검색 필터
    if (search) {
      contactQuery = contactQuery.or(
        `company_name_ko.ilike.%${search}%,` +
        `company_name_en.ilike.%${search}%,` +
        `person_in_charge.ilike.%${search}%`
      );
    }

    // 정렬
    contactQuery = contactQuery.order(sortField, { ascending: sortDirection === "asc" });

    // 페이지네이션
    contactQuery = contactQuery.range(from, to);

    const { data: contacts, error: contactError, count } = await contactQuery;

    if (contactError) throw contactError;

    // 각 연락처에 대해 제품 목록 조회
    const contactsWithProducts = await Promise.all(
      (contacts || []).map(async (contact) => {
        const { data: mappings } = await supabase
          .from("beauty_product_contacts_map_uuid")
          .select(`
            product_id,
            beauty_products!inner(
              id,
              ProductName,
              ProductNameEN,
              ProductManufacturer,
              ProductDetailImage,
              is_active
            )
          `)
          .eq("contact_id", contact.id);

        const products = mappings?.map((m: any) => ({
          id: m.beauty_products.id,
          name: m.beauty_products.ProductName,
          name_en: m.beauty_products.ProductNameEN,
          brand: m.beauty_products.ProductManufacturer,
          image_url: m.beauty_products.ProductDetailImage,
          is_active: m.beauty_products.is_active,
        })) || [];

        return {
          id: contact.id,
          company_name_ko: contact.company_name_ko,
          company_name_en: contact.company_name_en,
          contact_number: contact.contact_number,
          company_homepage: contact.company_homepage,
          person_in_charge: contact.person_in_charge,
          products,
          product_count: products.length,
        };
      })
    );

    return NextResponse.json({
      data: contactsWithProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처별 제품 조회 오류");
  }
}

