import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/server/api-utils";

/**
 * GET - 특정 연락처 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("beauty_product_contacts_map_uuid")
      .select(`
        id,
        product_id,
        contact_id,
        created_at,
        beauty_products(
          id,
          ProductName,
          ProductNameEN,
          ProductManufacturer,
          ProductDetailImage
        ),
        beauty_product_contacts(
          id,
          company_name_ko,
          company_name_en,
          contact_number,
          company_homepage,
          person_in_charge
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    const contact = {
      id: data.id,
      product_id: data.product_id,
      contact_id: data.contact_id,
      product: {
        id: data.beauty_products?.id,
        name: data.beauty_products?.ProductName,
        name_en: data.beauty_products?.ProductNameEN,
        brand: data.beauty_products?.ProductManufacturer,
        image_url: data.beauty_products?.ProductDetailImage,
      },
      contact: {
        id: data.beauty_product_contacts?.id,
        company_name_ko: data.beauty_product_contacts?.company_name_ko,
        company_name_en: data.beauty_product_contacts?.company_name_en,
        contact_number: data.beauty_product_contacts?.contact_number,
        company_homepage: data.beauty_product_contacts?.company_homepage,
        person_in_charge: data.beauty_product_contacts?.person_in_charge,
      },
      created_at: data.created_at,
    };

    return NextResponse.json({ data: contact });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처 조회 오류");
  }
}

/**
 * PUT - 연락처 정보 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = params;
    const body = await request.json();

    const {
      company_name_ko,
      company_name_en,
      contact_number,
      company_homepage,
      person_in_charge,
    } = body;

    // 매핑 정보 조회
    const { data: mapping, error: mappingError } = await supabase
      .from("beauty_product_contacts_map_uuid")
      .select("contact_id")
      .eq("id", id)
      .single();

    if (mappingError) throw mappingError;

    // 연락처 정보 업데이트
    const { data, error } = await supabase
      .from("beauty_product_contacts")
      .update({
        company_name_ko,
        company_name_en,
        contact_number,
        company_homepage,
        person_in_charge,
      })
      .eq("id", mapping.contact_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data,
      message: "연락처가 수정되었습니다.",
    });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처 수정 오류");
  }
}

/**
 * DELETE - 연락처 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = params;

    // 매핑 정보 조회
    const { data: mapping, error: mappingError } = await supabase
      .from("beauty_product_contacts_map_uuid")
      .select("contact_id")
      .eq("id", id)
      .single();

    if (mappingError) throw mappingError;

    // 1. 매핑 삭제
    const { error: deleteMappingError } = await supabase
      .from("beauty_product_contacts_map_uuid")
      .delete()
      .eq("id", id);

    if (deleteMappingError) throw deleteMappingError;

    // 2. 연락처 삭제
    const { error: deleteContactError } = await supabase
      .from("beauty_product_contacts")
      .delete()
      .eq("id", mapping.contact_id);

    if (deleteContactError) throw deleteContactError;

    return NextResponse.json({
      message: "연락처가 삭제되었습니다.",
    });
  } catch (error) {
    return createErrorResponse(error, 500, "연락처 삭제 오류");
  }
}

