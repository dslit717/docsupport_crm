import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/server/api-utils";

/**
 * GET: 유저 목록 조회
 * 
 * user_management_view를 활용하여 users + user_info 통합 조회
 * Admin 클라이언트 사용 (모든 유저 조회를 위해 RLS 우회)
 */
export async function GET(request: NextRequest) {
  try {
    // Admin 클라이언트 사용 (RLS 우회)
    const supabase = createSupabaseAdminClient();
    const { searchParams } = request.nextUrl;
    
    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const doctorVerified = searchParams.get("doctor_verified"); // "true" | "false" | null
    const isActive = searchParams.get("is_active"); // "true" | "false" | null
    
    const offset = (page - 1) * limit;

    // user_management_view에서 조회
    let query = supabase
      .from("user_management_view")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // 검색어 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,nickname.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    // 의사 인증 필터
    if (doctorVerified === "true") {
      query = query.eq("is_doctor_verified", true);
    } else if (doctorVerified === "false") {
      query = query.or("is_doctor_verified.eq.false,is_doctor_verified.is.null");
    }

    // 활성화 상태 필터
    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.or("is_active.eq.false,is_active.is.null");
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("유저 목록 조회 오류:", error);
      return createErrorResponse(error, 500, "유저 목록 조회 오류");
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("유저 목록 조회 오류:", error);
    return createErrorResponse(error, 500, "유저 목록 조회 오류");
  }
}

