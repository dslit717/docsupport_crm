import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// PUT: 광고 상태 설정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const { id } = params;
    const body = await request.json();

    const {
      advertisement_tier,
      advertisement_image_url,
      advertisement_expires_at,
      priority_score,
      advertisement_duration_days, // 광고 기간 (일수)
    } = body;

    // advertisement_tier가 'none'이 아니면 광고 활성화
    const isAdvertisementActive =
      advertisement_tier && advertisement_tier !== "none";

    let expiresAt = advertisement_expires_at;

    // 광고 기간이 설정된 경우 만료일 계산
    if (isAdvertisementActive && advertisement_duration_days) {
      const now = new Date();
      now.setDate(now.getDate() + advertisement_duration_days);
      expiresAt = now.toISOString();
    }

    // 광고가 비활성화되는 경우 만료일을 현재 시간으로 설정
    if (!isAdvertisementActive) {
      expiresAt = new Date().toISOString();
    }

    // 기존 업체 정보 조회 (로그용)
    const { data: existingVendor } = await supabase
      .from("vendors")
      .select("advertisement_expires_at, advertisement_tier, priority_score")
      .eq("id", id)
      .single();

    // 광고 상태 업데이트
    const { data, error } = await supabase
      .from("vendors")
      .update({
        advertisement_tier,
        advertisement_image_url,
        advertisement_expires_at: expiresAt,
        priority_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    // 광고 로그 저장
    if (!error && data) {
      const logAction = isAdvertisementActive ? "activate" : "deactivate";
      const logData = {
        vendor_id: id,
        action: logAction,
        previous_expires_at: existingVendor?.advertisement_expires_at || null,
        new_expires_at: expiresAt,
        previous_tier: existingVendor?.advertisement_tier || null,
        new_tier: advertisement_tier,
        previous_priority_score: existingVendor?.priority_score || 0,
        new_priority_score: priority_score,
        duration_days: isAdvertisementActive
          ? advertisement_duration_days
          : null,
        reason: isAdvertisementActive
          ? `광고 활성화 (${advertisement_duration_days}일)`
          : "광고 비활성화",
        created_by: "admin", // TODO: 실제 사용자 정보로 변경
      };

      await supabase.from("advertisement_logs").insert([logData]);
    }

    if (error) {
      console.error("광고 상태 설정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: isAdvertisementActive
        ? `광고가 설정되었습니다. 만료일: ${
            expiresAt ? new Date(expiresAt).toLocaleDateString() : "무제한"
          }`
        : "광고가 해제되었습니다.",
    });
  } catch (error) {
    console.error("광고 상태 설정 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET: 광고 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("vendors")
      .select(
        "id, name, advertisement_tier, advertisement_image_url, advertisement_expires_at, priority_score"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("광고 상태 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("광고 상태 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
