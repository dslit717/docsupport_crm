import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// PUT - 제품 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const { id } = await Promise.resolve(params);
    const body = await request.json();

    // 이미지는 별도 이미지 관리 페이지에서 처리 (ProductDetailImage는 업데이트하지 않음)
    const { data: product, error } = await supabase
      .from("beauty_products")
      .update({
        ProductName: body.name,
        ProductNameEN: body.name_en,
        ProductManufacturer: body.brand,
        ProductDetail: body.description,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product", details: error.message },
        { status: 500 }
      );
    }

    // 카테고리 매핑 업데이트
    if (body.category_ids !== undefined && Array.isArray(body.category_ids)) {
      // 기존 매핑 모두 삭제
      await supabase
        .from("beauty_product_category_map_uuid")
        .delete()
        .eq("product_id", id);

      // 새 매핑 추가
      if (body.category_ids.length > 0) {
        const categoryMappings = body.category_ids.map(
          (categoryId: string) => ({
            product_id: id,
            category_id: categoryId,
          })
        );

        await supabase
          .from("beauty_product_category_map_uuid")
          .insert(categoryMappings);
      }
    }

    // 링크 정보 업데이트 (여러 개)
    if (body.links !== undefined && Array.isArray(body.links)) {
      // 기존 링크 매핑 조회
      const { data: existingMappings } = await supabase
        .from("beauty_product_links_map_uuid")
        .select("link_id")
        .eq("product_id", id);

      // 기존 링크 삭제
      if (existingMappings && existingMappings.length > 0) {
        const linkIds = existingMappings.map((m) => m.link_id);

        // 링크 매핑 삭제
        await supabase
          .from("beauty_product_links_map_uuid")
          .delete()
          .eq("product_id", id);

        // 링크 삭제
        await supabase.from("beauty_product_links").delete().in("id", linkIds);
      }

      // 새 링크 추가
      for (const link of body.links) {
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
                product_id: id,
                link_id: newLink.id,
              },
            ]);
          }
        }
      }
    }

    // 연락처 정보 업데이트
    if (body.contacts !== undefined && Array.isArray(body.contacts)) {
      // 기존 연락처 매핑 조회
      const { data: existingContactMappings } = await supabase
        .from("beauty_product_contacts_map_uuid")
        .select("contact_id")
        .eq("product_id", id);

      // 기존 연락처 삭제
      if (existingContactMappings && existingContactMappings.length > 0) {
        const contactIds = existingContactMappings.map((m) => m.contact_id);

        // 연락처 매핑 삭제
        await supabase
          .from("beauty_product_contacts_map_uuid")
          .delete()
          .eq("product_id", id);

        // 연락처 삭제
        await supabase
          .from("beauty_product_contacts")
          .delete()
          .in("id", contactIds);
      }

      // 새 연락처 추가
      for (const contact of body.contacts) {
        if (contact.company_name_ko) {
          // 기존 연락처가 있으면 업데이트, 없으면 생성
          if (contact.id) {
            await supabase
              .from("beauty_product_contacts")
              .update({
                company_name_ko: contact.company_name_ko,
                company_name_en: contact.company_name_en || null,
                contact_number: contact.contact_number || null,
                company_homepage: contact.company_homepage || null,
                person_in_charge: contact.person_in_charge || null,
              })
              .eq("id", contact.id);

            // 매핑이 없으면 추가
            const { data: existingMapping } = await supabase
              .from("beauty_product_contacts_map_uuid")
              .select("id")
              .eq("product_id", id)
              .eq("contact_id", contact.id)
              .single();

            if (!existingMapping) {
              await supabase.from("beauty_product_contacts_map_uuid").insert([
                {
                  product_id: id,
                  contact_id: contact.id,
                },
              ]);
            }
          } else {
            // 새 연락처 생성
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
                  product_id: id,
                  contact_id: newContact.id,
                },
              ]);
            }
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
        image_name: product.ProductDetailImage, // 이미지는 별도 페이지에서 관리
      },
      message: "제품이 수정되었습니다.",
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - 제품 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const { id } = await Promise.resolve(params);

    // 관련 매핑 삭제
    await supabase
      .from("beauty_product_category_map_uuid")
      .delete()
      .eq("product_id", id);

    // 링크 매핑 조회 및 삭제
    const { data: linkMappings } = await supabase
      .from("beauty_product_links_map_uuid")
      .select("link_id")
      .eq("product_id", id);

    if (linkMappings && linkMappings.length > 0) {
      const linkIds = linkMappings.map((m) => m.link_id);

      // 링크 매핑 삭제
      await supabase
        .from("beauty_product_links_map_uuid")
        .delete()
        .eq("product_id", id);

      // 링크 삭제
      await supabase.from("beauty_product_links").delete().in("id", linkIds);
    }

    // 제품 삭제
    const { error } = await supabase
      .from("beauty_products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "제품이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
