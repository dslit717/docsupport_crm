/**
 * 로그인 로그 조회 API
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createErrorResponse,
  parsePaginationParams,
  QueryBuilder,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

/**
 * GET - 로그인 로그 목록 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = request.nextUrl;

    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const userId = searchParams.get("user_id") || "";
    const loginMethod = searchParams.get("login_method") || "";
    const success = searchParams.get("success") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";
    const deviceType = searchParams.get("device_type") || "";

    // 로그인 로그 조회 (조인 없이)
    const queryBuilder = new QueryBuilder(
      supabase.from("user_login_logs").select("*", { count: "exact" })
    );

    queryBuilder
      .search(search, ["email", "ip_address", "user_agent"])
      .filter(userId !== "", (q) => q.eq("user_id", userId))
      .filter(loginMethod !== "", (q) => q.eq("login_method", loginMethod))
      .filter(success === "true", (q) => q.eq("success", true))
      .filter(success === "false", (q) => q.eq("success", false))
      .filter(deviceType !== "", (q) => q.eq("device_type", deviceType))
      .filter(startDate !== "", (q) => q.gte("created_at", startDate))
      .filter(endDate !== "", (q) => q.lte("created_at", endDate))
      .sort("created_at", "desc")
      .paginate(page, limit);

    const { data: logs, error, count } = await queryBuilder.execute();

    if (error) {
      return createErrorResponse(error, 500, "로그인 로그 조회 오류");
    }

    return NextResponse.json({
      success: true,
      data: logs || [],
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

