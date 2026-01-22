import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { openai } from "@/lib/server/openai-api";

// POST: 업체 설명을 벡터로 변환하여 저장
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = params;
    const body = await request.json();

    const { description_md } = body;

    if (!description_md) {
      return NextResponse.json(
        { error: "업체 설명이 필요합니다." },
        { status: 400 }
      );
    }

    // OpenAI를 사용하여 텍스트를 벡터로 변환
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description_md,
    });

    const embeddingVector = embedding.data[0].embedding;

    // 벡터를 데이터베이스에 저장
    const { data, error } = await supabase
      .from("vendors")
      .update({
        search_embedding: `[${embeddingVector.join(",")}]`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("벡터 저장 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      message: "업체 설명이 벡터로 변환되어 저장되었습니다.",
    });
  } catch (error) {
    console.error("벡터 변환 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
