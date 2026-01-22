import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  parsePaginationParams,
  QueryBuilder,
} from "@/lib/server/api-utils";

// GET - 관리자용 구인글 목록 조회 (모든 상태 포함)
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = request.nextUrl;

    // 파라미터 파싱
    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const jobType = searchParams.get("jobType") || "";
    const isPaid = searchParams.get("isPaid") || "";

    // 쿼리 빌더 사용
    const queryBuilder = new QueryBuilder(
      supabase.from("job_posts").select("*", { count: "exact" })
    );

    queryBuilder
      .search(search, ["title", "hospital_name", "description"])
      .filter(status && status !== "all", (q) => q.eq("status", status))
      .filter(jobType && jobType !== "all", (q) => q.eq("job_type", jobType))
      .filter(isPaid === "true", (q) => q.eq("is_paid", true))
      .filter(isPaid === "false", (q) => q.eq("is_paid", false))
      .sort("created_at", "desc")
      .paginate(page, limit);

    const { data: jobPosts, error, count } = await queryBuilder.execute();

    if (error) {
      return createErrorResponse(error, 500, "구인글 조회 오류");
    }

    return NextResponse.json({
      success: true,
      data: jobPosts || [],
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

// PUT - 구인글 상태 변경 (관리자용)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await request.json();
    const { id, status, paid_ad_approved, paid_ad_approved_by } = body;

    const updateData: any = { updated_at: new Date().toISOString() };

    if (status) {
      updateData.status = status;
    }

    if (paid_ad_approved !== undefined) {
      updateData.paid_ad_approved = paid_ad_approved;
      if (paid_ad_approved) {
        updateData.paid_ad_approved_at = new Date().toISOString();
        if (paid_ad_approved_by) {
          updateData.paid_ad_approved_by = paid_ad_approved_by;
        }
      }
    }

    const { data, error } = await supabase
      .from("job_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 500, "구인글 수정 오류");
    }

    return NextResponse.json({
      success: true,
      data,
      message: "구인글이 수정되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

// DELETE - 구인글 삭제 (관리자용)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return createErrorResponse(new Error("ID is required"), 400);
    }

    const { error } = await supabase.from("job_posts").delete().eq("id", id);

    if (error) {
      return createErrorResponse(error, 500, "구인글 삭제 오류");
    }

    return NextResponse.json({
      success: true,
      message: "구인글이 삭제되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}
