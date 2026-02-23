import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";
import { generateSlug } from "@/lib/server/api-utils";

// 태그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("blog_tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("태그 조회 실패:", error);
      return NextResponse.json({ error: "태그 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ tags: data || [] });
  } catch (error) {
    console.error("태그 조회 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 태그 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "태그 이름은 필수입니다" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const slug = generateSlug(name) || "tag-" + Date.now();

    const { data, error } = await supabase
      .from("blog_tags")
      .insert({ name, slug })
      .select()
      .single();

    if (error) {
      console.error("태그 생성 실패:", error);
      return NextResponse.json(
        { error: "태그 생성 실패", details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tag: data });
  } catch (error) {
    console.error("태그 생성 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}


