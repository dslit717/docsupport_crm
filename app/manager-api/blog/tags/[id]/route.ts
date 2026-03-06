import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";
import { generateSlug } from "@/lib/server/api-utils";

// 태그 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { name, isActive } = body;

    const supabase = createSupabaseAdminClient();

    const updatePayload: { name: string; is_active: boolean; slug?: string } = {
      name,
      is_active: isActive,
    };
    if (name) {
      updatePayload.slug = generateSlug(name) || `tag-${resolvedParams.id}`;
    }

    const { data, error } = await supabase
      .from("blog_tags")
      .update(updatePayload)
      .eq("id", resolvedParams.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "태그 수정 실패", details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, tag: data });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 태그 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // 태그와 연결된 포스트 관계 삭제
    await supabase.from("blog_post_tags").delete().eq("tag_id", resolvedParams.id);

    // 구독 삭제
    await supabase.from("blog_subscriptions").delete().eq("tag_id", resolvedParams.id);

    // 태그 삭제
    const { error } = await supabase
      .from("blog_tags")
      .delete()
      .eq("id", resolvedParams.id);

    if (error) {
      return NextResponse.json({ error: "태그 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

