import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  parsePaginationParams,
} from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET - 세미나 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = request.nextUrl;

    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    let query = supabase
      .from("seminars")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,organizer.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (category && category !== "전체") {
      query = query.eq("category", category);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    query = query.order("date", { ascending: true });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data: seminars, error, count } = await query.range(from, to);

    if (error) {
      return createErrorResponse(error, 500, "세미나 조회 오류");
    }

    return NextResponse.json({
      success: true,
      data: seminars || [],
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

// POST - 새 세미나 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const body = await request.json();

    const { data: seminar, error } = await supabase
      .from("seminars")
      .insert([
        {
          title: body.title,
          category: body.category,
          location: body.location,
          date: body.date,
          time: body.time,
          participants: body.participants || 0,
          fee: body.fee,
          organizer: body.organizer,
          description: body.description,
          status: body.status || "upcoming",
          is_active: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 500, "세미나 생성 오류");
    }

    return NextResponse.json({
      success: true,
      data: seminar,
      message: "세미나가 생성되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

