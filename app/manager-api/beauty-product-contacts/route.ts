import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/server/api-utils";

/**
 * GET - 제품별 연락처 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const productId = searchParams.get("product_id") || "";
    const sortField = searchParams.get("sortField") || "created_at";
    const sortDirection = (searchParams.get("sortDirection") || "desc") as "asc" | "desc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 연락처 테이블에서 제품 정보와 함께 조회
    let query = supabase
      .from("beauty_product_contacts_map_uuid")
      .select(`
        id,
        product_id,
        contact_id,
        created_at,
        beauty_products!inner(
          id,
          ProductName,
          ProductNameEN,
          ProductManufacturer,
          ProductDetailImage
        ),
        beauty_product_contacts!inner(
          id,
          company_name_ko,
          company_name_en,
          contact_number,
          company_homepage,
          person_in_charge
        )
      `)
      .range(from, to);

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

    // 정렬
    if (sortField === "product_name") {
      query = query.order("beauty_products.ProductName", { ascending: sortDirection === "asc" });
    } else if (sortField === "company_name") {
      query = query.order("beauty_product_contacts.company_name_ko", { ascending: sortDirection === "asc" });
    } else {
      query = query.order(sortField, { ascending: sortDirection === "asc" });
    }

    const { data, error } = await query;

    if (error) throw error;

    // 데이터 변환
    const contacts = data?.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      contact_id: item.contact_id,
      product: {
        id: item.beauty_products.id,
        name: item.beauty_products.ProductName,
        name_en: item.beauty_products.ProductNameEN,
        brand: item.beauty_products.ProductManufacturer,
        image_url: item.beauty_products.ProductDetailImage,
      },
      contact: {
        id: item.beauty_product_contacts.id,
        company_name_ko: item.beauty_product_contacts.company_name_ko,
        company_name_en: item.beauty_product_contacts.company_name_en,
        contact_number: item.beauty_product_contacts.contact_number,
        company_homepage: item.beauty_product_contacts.company_homepage,
        person_in_charge: item.beauty_product_contacts.person_in_charge,
      },
      created_at: item.created_at,
    })) || [];

    return NextResponse.json({ data: contacts });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처 목록 조회 오류");
  }
}

/**
 * POST - 새 연락처 생성 및 제품에 연결
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const {
      product_id,
      company_name_ko,
      company_name_en,
      contact_number,
      company_homepage,
      person_in_charge,
    } = body;

    // 필수 필드 검증
    if (!product_id || !company_name_ko) {
      return NextResponse.json(
        { error: "제품 ID와 회사명(한글)은 필수입니다." },
        { status: 400 }
      );
    }

    // 1. 연락처 생성
    const { data: contact, error: contactError } = await supabase
      .from("beauty_product_contacts")
      .insert({
        company_name_ko,
        company_name_en,
        contact_number,
        company_homepage,
        person_in_charge,
      })
      .select()
      .single();

    if (contactError) throw contactError;

    // 2. 제품-연락처 매핑 생성
    const { data: mapping, error: mappingError } = await supabase
      .from("beauty_product_contacts_map_uuid")
      .insert({
        product_id,
        contact_id: contact.id,
      })
      .select()
      .single();

    if (mappingError) {
      // 매핑 생성 실패시 연락처 삭제 (rollback)
      await supabase
        .from("beauty_product_contacts")
        .delete()
        .eq("id", contact.id);
      throw mappingError;
    }

    return NextResponse.json({
      data: { ...mapping, contact },
      message: "연락처가 생성되었습니다.",
    });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처 생성 오류");
  }
}

