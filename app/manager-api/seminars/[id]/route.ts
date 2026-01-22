import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createErrorResponse } from "@/lib/server/api-utils";

// PUT - 세미나 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await request.json();
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const { data: seminar, error } = await supabase
      .from("seminars")
      .update({
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
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 500, "세미나 수정 오류");
    }

    return NextResponse.json({
      success: true,
      data: seminar,
      message: "세미나가 수정되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

// DELETE - 세미나 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const { error } = await supabase
      .from("seminars")
      .delete()
      .eq("id", id);

    if (error) {
      return createErrorResponse(error, 500, "세미나 삭제 오류");
    }

    return NextResponse.json({
      success: true,
      message: "세미나가 삭제되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

