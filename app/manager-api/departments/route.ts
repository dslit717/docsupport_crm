import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET: 진료과목 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("medical_departments")
      .select("*")
      .order("name");

    if (error) {
      console.error("진료과목 목록 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("진료과목 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 진료과목 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const { name, description, slug } = body;

    if (!name) {
      return NextResponse.json(
        { error: "진료과목명은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("medical_departments")
      .insert({
        name,
        description,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9가-힣]/g, "-"),
      })
      .select()
      .single();

    if (error) {
      console.error("진료과목 생성 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("진료과목 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
