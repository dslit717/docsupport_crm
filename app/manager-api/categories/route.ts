import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// GET: 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("vendor_categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("카테고리 목록 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("카테고리 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) return authResult.error;

    const supabase = await createSupabaseAdminClient();
    const body = await request.json();

    const { name, description, slug } = body;

    if (!name) {
      return NextResponse.json(
        { error: "카테고리명은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vendor_categories")
      .insert({
        name,
        description,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9가-힣]/g, "-"),
      })
      .select()
      .single();

    if (error) {
      console.error("카테고리 생성 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("카테고리 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
