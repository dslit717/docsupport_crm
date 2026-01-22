import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/server/api-utils";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// PUT - 개원자리 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const { data: location, error } = await supabase
      .from("clinic_locations")
      .update({
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
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 500, "개원자리 수정 오류");
    }

    return NextResponse.json({
      success: true,
      data: location,
      message: "개원자리가 수정되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

// DELETE - 개원자리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const { error } = await supabase
      .from("clinic_locations")
      .delete()
      .eq("id", id);

    if (error) {
      return createErrorResponse(error, 500, "개원자리 삭제 오류");
    }

    return NextResponse.json({
      success: true,
      message: "개원자리가 삭제되었습니다.",
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "서버 오류");
  }
}

