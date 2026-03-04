import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

const CONFIG_KEY = "selected_models";
const VALID_MODELS = ["midjourney", "nano_banana"] as const;
const DEFAULT_MODELS = ["midjourney", "nano_banana"];

/** 사용 모델 설정 조회 */
export async function GET() {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profile_photo_config")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const raw = data?.value;
    const selected_models =
      Array.isArray(raw) && raw.every((x) => typeof x === "string")
        ? raw
        : DEFAULT_MODELS;

    return NextResponse.json({ selected_models });
  } catch {
    return NextResponse.json(
      { error: "설정을 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}

/** 사용 모델 설정 저장 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { selected_models } = body;
    if (!Array.isArray(selected_models)) {
      return NextResponse.json(
        { error: "selected_models 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const filtered = selected_models.filter((m) =>
      VALID_MODELS.includes(m as (typeof VALID_MODELS)[number])
    );
    if (filtered.length === 0) {
      return NextResponse.json(
        { error: "midjourney 또는 nano_banana 중 최소 하나를 선택하세요." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error: upsertError } = await supabase
      .from("profile_photo_config")
      .upsert({ key: CONFIG_KEY, value: filtered }, { onConflict: "key" });

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, selected_models: filtered });
  } catch {
    return NextResponse.json(
      { error: "설정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
