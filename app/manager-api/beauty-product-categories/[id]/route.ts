import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PUT - 카테고리 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const { data: category, error } = await supabase
      .from("beauty_product_category")
      .update({
        CategoryName: body.name,
        CategoryNameKO: body.name,
        CategorySEO: body.slug,
        CategoryDetail: body.description,
        show_order: body.display_order,
        is_main_category: body.is_active,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return NextResponse.json(
        { error: "Failed to update category", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.CategoryNameKO,
        slug: category.CategorySEO,
        description: category.CategoryDetail,
        display_order: category.show_order,
        is_active: category.is_main_category,
      },
      message: "카테고리가 수정되었습니다.",
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // 이 카테고리를 사용하는 제품이 있는지 확인
    const { data: mappings, error: checkError } = await supabase
      .from("beauty_product_category_map_uuid")
      .select("id")
      .eq("category_id", params.id)
      .limit(1);

    if (checkError) {
      console.error("Error checking products:", checkError);
      return NextResponse.json(
        { error: "Failed to check products", details: checkError.message },
        { status: 500 }
      );
    }

    if (mappings && mappings.length > 0) {
      return NextResponse.json(
        { error: "이 카테고리를 사용하는 제품이 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("beauty_product_category")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json(
        { error: "Failed to delete category", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "카테고리가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
