import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  parsePaginationParams,
  parseSortParams,
  QueryBuilder,
  applyCategoryFilter,
  validateRequiredFields,
  updateRelations,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET - 제품 목록 조회 (페이지네이션, 검색, 필터링)
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = request.nextUrl;

    // 파라미터 파싱
    const { page, limit } = parsePaginationParams(searchParams);
    const { sortField, sortDirection } = parseSortParams(searchParams, "id", "desc");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id") || "";
    const isActive = searchParams.get("is_active") || "";

    // 카테고리 필터 처리
    if (categoryId) {
      const productIds = await applyCategoryFilter(
        supabase,
        categoryId,
        "beauty_product_category_map_uuid",
        "product_id"
      );

      if (productIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      // 카테고리로 필터링된 제품 조회
      const queryBuilder = new QueryBuilder(
        supabase.from("beauty_products").select("*")
      );

      queryBuilder
        .filter(true, (q) => q.in("id", productIds))
        .search(search, ["ProductName", "ProductManufacturer", "ProductDetail"])
        .filter(isActive === "true", (q) => q.eq("is_active", true))
        .filter(isActive === "false", (q) => q.eq("is_active", false))
        .sort(sortField, sortDirection)
        .paginate(page, limit);

      const { data: products, error } = await queryBuilder.execute();

      if (error) {
        return createErrorResponse(error, 500, "제품 조회 오류");
      }

      // 제품 정보 변환 및 추가 정보 로드
      const productsWithDetails = await enrichProductsWithDetails(supabase, products || []);

      return NextResponse.json({ success: true, data: productsWithDetails });
    }

    // 일반 조회
    const queryBuilder = new QueryBuilder(
      supabase.from("beauty_products").select("*")
    );

    queryBuilder
      .search(search, ["ProductName", "ProductManufacturer", "ProductDetail"])
      .filter(isActive === "true", (q) => q.eq("is_active", true))
      .filter(isActive === "false", (q) => q.eq("is_active", false))
      .sort(sortField, sortDirection)
      .paginate(page, limit);

    const { data: products, error } = await queryBuilder.execute();

    if (error) {
      return createErrorResponse(error, 500, "제품 조회 오류");
    }

    // 제품 정보 변환 및 추가 정보 로드
    const productsWithDetails = await enrichProductsWithDetails(supabase, products || []);

    return NextResponse.json({ success: true, data: productsWithDetails });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

// POST - 새 제품 생성
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

    // 제품 생성 (이미지는 별도 이미지 관리 페이지에서 처리)
    const { data: product, error } = await supabase
      .from("beauty_products")
      .insert([
        {
          ProductName: body.name,
          ProductNameEN: body.name_en,
          ProductManufacturer: body.brand,
          ProductDetail: body.description,
          is_active: body.is_active !== undefined ? body.is_active : true,
        },
      ])
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 500, "제품 생성 오류");
    }

    // 카테고리 연결
    if (body.category_ids && Array.isArray(body.category_ids) && body.category_ids.length > 0) {
      await updateRelations(
        supabase,
        product.id,
        body.category_ids,
        "beauty_product_category_map_uuid",
        "product_id",
        "category_id"
      );
    }

    // 링크 정보 추가
    if (body.links && Array.isArray(body.links) && body.links.length > 0) {
      await addProductLinks(supabase, product.id, body.links);
    }

    // 연락처 정보 추가
    if (body.contacts && Array.isArray(body.contacts) && body.contacts.length > 0) {
      for (const contact of body.contacts) {
        if (contact.company_name_ko) {
          const { data: newContact } = await supabase
            .from("beauty_product_contacts")
            .insert([
              {
                company_name_ko: contact.company_name_ko,
                company_name_en: contact.company_name_en || null,
                contact_number: contact.contact_number || null,
                company_homepage: contact.company_homepage || null,
                person_in_charge: contact.person_in_charge || null,
              },
            ])
            .select()
            .single();

          if (newContact) {
            await supabase.from("beauty_product_contacts_map_uuid").insert([
              {
                product_id: product.id,
                contact_id: newContact.id,
              },
            ]);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product.ProductName,
        brand: product.ProductManufacturer,
        description: product.ProductDetail,
        image_name: product.ProductDetailImage,
      },
      message: "제품이 생성되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "제품 생성 오류");
  }
}

/**
 * 제품 상세 정보 추가 (카테고리, 링크)
 */
async function enrichProductsWithDetails(supabase: any, products: any[]) {
  return await Promise.all(
    products.map(async (product) => {
      // 카테고리 정보
      const { data: mappings } = await supabase
        .from("beauty_product_category_map_uuid")
        .select("category_id, beauty_product_category(*)")
        .eq("product_id", product.id);

      let categories: Array<{ id: string; name: string }> = [];
      if (mappings && mappings.length > 0) {
        categories = mappings
          .filter((m: any) => m.beauty_product_category)
          .map((m: any) => {
            const cat = m.beauty_product_category as any;
            return {
              id: cat.id,
              name: cat.CategoryNameKO || cat.CategoryName,
            };
          });
      }

      // 링크 정보
      const { data: linkMappings } = await supabase
        .from("beauty_product_links_map_uuid")
        .select("link_id, beauty_product_links(*)")
        .eq("product_id", product.id);

      let links: Array<{ name: string; url: string; type: string }> = [];
      
      if (linkMappings && linkMappings.length > 0) {
        links = linkMappings
          .filter((m: any) => m.beauty_product_links)
          .map((m: any) => {
            const link = m.beauty_product_links as any;
            return {
              name: link.link_name || "",
              url: link.link || "",
              type: link.link_type || "other",
            };
          });
      }

      // 연락처 정보
      const { data: contactMappings } = await supabase
        .from("beauty_product_contacts_map_uuid")
        .select("contact_id, beauty_product_contacts(*)")
        .eq("product_id", product.id);

      let contacts: Array<{
        id: string;
        company_name_ko: string;
        company_name_en?: string;
        contact_number?: string;
        company_homepage?: string;
        person_in_charge?: string;
      }> = [];
      
      if (contactMappings && contactMappings.length > 0) {
        contacts = contactMappings
          .filter((m: any) => m.beauty_product_contacts)
          .map((m: any) => {
            const contact = m.beauty_product_contacts as any;
            return {
              id: contact.id,
              company_name_ko: contact.company_name_ko || "",
              company_name_en: contact.company_name_en || "",
              contact_number: contact.contact_number || "",
              company_homepage: contact.company_homepage || "",
              person_in_charge: contact.person_in_charge || "",
            };
          });
      }

      return {
        id: product.id,
        product_id: product.ProductID,
        name: product.ProductName,
        name_en: product.ProductNameEN,
        brand: product.ProductManufacturer,
        category_ids: mappings?.map((m: any) => m.category_id) || [],
        description: product.ProductDetail,
        links: links,
        contacts: contacts,
        image_name: product.ProductDetailImage,
        is_active: product.is_active ?? true,
        categories: categories,
      };
    })
  );
}

/**
 * 제품 링크 추가
 */
async function addProductLinks(supabase: any, productId: string, links: any[]) {
  for (const link of links) {
    if (link.url) {
      const { data: newLink } = await supabase
        .from("beauty_product_links")
        .insert([
          {
            link_name: link.name || "제품 링크",
            link_type: link.type || "other",
            link: link.url,
            is_newtab: 1,
          },
        ])
        .select()
        .single();

      if (newLink) {
        await supabase.from("beauty_product_links_map_uuid").insert([
          {
            product_id: productId,
            link_id: newLink.id,
          },
        ]);
      }
    }
  }
}
