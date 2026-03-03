import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

export type PresetItem = { id: string; label: string; prompt: string; image_url?: string | null };
export type PresetsResponse = { female: PresetItem[]; male: PresetItem[] };

const PRESET_COLS = "gender, preset_id, label, prompt, image_url, sort_order";

/** 프리셋 목록 조회 (관리자) */
export async function GET() {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profile_photo_prompt_presets")
      .select(PRESET_COLS)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapRow = (r: { preset_id: string; label: string; prompt: string; image_url: string | null }) => ({
      id: r.preset_id,
      label: r.label,
      prompt: r.prompt,
      image_url: r.image_url ?? null,
    });
    const female = (data || []).filter((r) => r.gender === "female").map(mapRow);
    const male = (data || []).filter((r) => r.gender === "male").map(mapRow);

    return NextResponse.json({ female, male } as PresetsResponse);
  } catch {
    return NextResponse.json({ error: "프리셋을 불러올 수 없습니다." }, { status: 500 });
  }
}

/** 프리셋 수정 (관리자) */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { female, male } = body as PresetsResponse;
    if (!Array.isArray(female) || !Array.isArray(male)) {
      return NextResponse.json(
        { error: "female, male 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const rows: Array<{
      gender: string;
      preset_id: string;
      label: string;
      prompt: string;
      image_url: string | null;
      sort_order: number;
      updated_at: string;
    }> = [];

    female.forEach((p, i) => {
      if (p && typeof p.id === "string" && typeof p.label === "string" && typeof p.prompt === "string") {
        rows.push({
          gender: "female",
          preset_id: p.id,
          label: p.label,
          prompt: p.prompt,
          image_url: typeof p.image_url === "string" ? p.image_url : null,
          sort_order: i,
          updated_at: now,
        });
      }
    });
    male.forEach((p, i) => {
      if (p && typeof p.id === "string" && typeof p.label === "string" && typeof p.prompt === "string") {
        rows.push({
          gender: "male",
          preset_id: p.id,
          label: p.label,
          prompt: p.prompt,
          image_url: typeof p.image_url === "string" ? p.image_url : null,
          sort_order: i,
          updated_at: now,
        });
      }
    });

    for (const row of rows) {
      const { error: upsertError } = await supabase
        .from("profile_photo_prompt_presets")
        .upsert(
          {
            gender: row.gender,
            preset_id: row.preset_id,
            label: row.label,
            prompt: row.prompt,
            image_url: row.image_url,
            sort_order: row.sort_order,
            updated_at: row.updated_at,
          },
          { onConflict: "gender,preset_id" }
        );
      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
}
