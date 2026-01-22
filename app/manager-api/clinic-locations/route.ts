import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createErrorResponse,
  parsePaginationParams,
  QueryBuilder,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET - 개원자리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = request.nextUrl;

    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const region = searchParams.get("region") || "";
    const type = searchParams.get("type") || "";

    const queryBuilder = new QueryBuilder(
      supabase.from("clinic_locations").select("*", { count: "exact" })
    );

    queryBuilder
      .search(search, ["title", "address", "description"])
      .filter(region && region !== "전체", (q) => q.eq("region", region))
      .filter(type && type !== "전체", (q) => q.eq("type", type))
      .sort("created_at", "desc")
      .paginate(page, limit);

    const { data: locations, error, count } = await queryBuilder.execute();

    if (error) {
      return createErrorResponse(error, 500, "개원자리 조회 오류");
    }

    return NextResponse.json({
      success: true,
      data: locations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

// POST - 새 개원자리 등록
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const { data: location, error } = await supabase
      .from("clinic_locations")
      .insert([
        {
          title: body.title,
          address: body.address,
          region: body.region,
          type: body.type,
          size_sqm: body.size_sqm,
          floor: body.floor,
          monthly_rent: body.monthly_rent,
          deposit: body.deposit,
          parking_spaces: body.parking_spaces || 0,
          facilities: body.facilities || [],
          description: body.description,
          contact_phone: body.contact_phone,
          available_date: body.available_date,
          rating: body.rating || 0.0,
          images: body.images || [],
          latitude: body.latitude,
          longitude: body.longitude,
          is_active: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 500, "개원자리 등록 오류");
    }

    return NextResponse.json({
      success: true,
      data: location,
      message: "개원자리가 등록되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

