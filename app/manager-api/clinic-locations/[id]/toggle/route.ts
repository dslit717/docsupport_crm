import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// PATCH - 개원자리 활성 상태만 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: location, error } = await supabase
      .from("clinic_locations")
      .update({ is_active: body.is_active })
      .eq("id", id)
      .select("id, is_active")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to toggle location status", details: error.message },
        { status: 500 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: location.id,
        is_active: location.is_active,
      },
      message: `개원자리가 ${location.is_active ? "활성화" : "비활성화"}되었습니다.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

