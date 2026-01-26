import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET - 제품 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();

    const { data: categories, error } = await supabase
      .from("beauty_product_category")
      .select("*")
      .order("show_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories", details: error.message },
        { status: 500 }
      );
    }

    // 데이터 형식 변환 (PascalCase -> camelCase)
    const formattedCategories =
      categories?.map((cat) => ({
        id: cat.id,
        name: cat.CategoryNameKO || cat.CategoryName,
        slug: cat.CategorySEO || cat.CategoryName,
        description: cat.CategoryDetail,
        display_order: cat.show_order || 0,
        is_active: cat.is_main_category || true,
      })) || [];

    return NextResponse.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - 새 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const body = await request.json();

    const { data: category, error } = await supabase
      .from("beauty_product_category")
      .insert([
        {
          CategoryName: body.name,
          CategoryNameKO: body.name,
          CategorySEO: body.slug,
          CategoryDetail: body.description,
          show_order: body.display_order || 0,
          is_main_category: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return NextResponse.json(
        { error: "Failed to create category", details: error.message },
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
      message: "카테고리가 생성되었습니다.",
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
