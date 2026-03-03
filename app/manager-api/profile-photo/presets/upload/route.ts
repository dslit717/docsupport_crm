import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// 기존 product_imgs 버킷 내 경로 사용 (별도 버킷 생성 불필요)
const BUCKET = "product_imgs";
const PREFIX = "profile-photo-presets";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** 프리셋 대표 이미지 업로드 (관리자) */
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const gender = formData.get("gender") as string | null;
    const presetId = formData.get("preset_id") as string | null;

    if (!file || !gender || !presetId) {
      return NextResponse.json(
        { error: "file, gender, preset_id가 필요합니다." },
        { status: 400 }
      );
    }
    if (!["female", "male"].includes(gender)) {
      return NextResponse.json({ error: "gender는 female 또는 male이어야 합니다." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다." }, { status: 400 });
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "JPEG, PNG, WebP만 업로드 가능합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${PREFIX}/${gender}/${presetId}.${ext}`;

    const supabase = createSupabaseAdminClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
