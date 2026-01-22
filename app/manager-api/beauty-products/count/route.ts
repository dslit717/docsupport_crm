import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - 제품 개수 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id") || "";
    const isActive = searchParams.get("is_active") || "";

    // Build query
    let query = supabase
      .from("beauty_products")
      .select("id", { count: "exact", head: true });

    // Apply filters
    if (search) {
      query = query.or(
        `ProductName.ilike.%${search}%,ProductManufacturer.ilike.%${search}%,ProductDetail.ilike.%${search}%`
      );
    }

    // is_active 필터
    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    // 카테고리 필터는 별도 처리
    if (categoryId) {
      const { data: mappings } = await supabase
        .from("beauty_product_category_map_uuid")
        .select("product_id")
        .eq("category_id", categoryId);

      if (mappings && mappings.length > 0) {
        const productIds = mappings.map((m) => m.product_id);
        query = query.in("id", productIds);
      } else {
        return NextResponse.json({
          success: true,
          count: 0,
        });
      }
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error counting products:", error);
      return NextResponse.json(
        { error: "Failed to count products", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
