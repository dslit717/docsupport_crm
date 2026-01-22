import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET: 광고 로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const vendorId = searchParams.get("vendor_id");
    const action = searchParams.get("action");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("advertisement_logs")
      .select(
        `
        *,
        vendors:vendor_id(
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // 업체 필터
    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    // 액션 필터
    if (action) {
      query = query.eq("action", action);
    }

    // 날짜 범위 필터
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("광고 로그 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("광고 로그 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 광고 로그 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const {
      vendor_id,
      action,
      previous_expires_at,
      new_expires_at,
      previous_tier,
      new_tier,
      previous_priority_score,
      new_priority_score,
      duration_days,
      reason,
      created_by,
    } = body;

    if (!vendor_id || !action) {
      return NextResponse.json(
        { error: "업체 ID와 액션은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("advertisement_logs")
      .insert([
        {
          vendor_id,
          action,
          previous_expires_at,
          new_expires_at,
          previous_tier,
          new_tier,
          previous_priority_score,
          new_priority_score,
          duration_days,
          reason,
          created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("광고 로그 생성 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: "광고 로그가 생성되었습니다.",
    });
  } catch (error) {
    console.error("광고 로그 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
