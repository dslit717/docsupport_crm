import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// 블로그 글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("GET /manager-api/blog/posts/[id] - params:", resolvedParams);
    
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    console.log("Fetching blog post with ID:", resolvedParams.id);

    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        `
        *,
        tags:blog_post_tags(
          tag:blog_tags(*)
        )
      `
      )
      .eq("id", resolvedParams.id)
      .single();

    console.log("Blog post query result:", { data, error });

    if (error) {
      console.error("블로그 글 조회 실패:", error);
      return NextResponse.json({ error: "블로그 글을 찾을 수 없습니다", details: error }, { status: 404 });
    }

    // 태그 데이터 변환
    const formattedPost = {
      ...data,
      tags: (data as any).tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("블로그 글 조회 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 블로그 글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, status, tagIds, authorName } = body;

    const supabase = createSupabaseAdminClient();
    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .update({
        title,
        content,
        status,
        updated_at: new Date().toISOString(),
        ...(authorName !== undefined && { author_name: authorName.trim() || null }),
      })
      .eq("id", resolvedParams.id)
      .select()
      .single();

    if (postError) {
      console.error("블로그 글 수정 실패:", postError);
      return NextResponse.json({ error: "블로그 글 수정 실패" }, { status: 500 });
    }

    // 기존 태그 관계 삭제
    await supabase.from("blog_post_tags").delete().eq("post_id", resolvedParams.id);

    // 새 태그 연결
    if (tagIds && tagIds.length > 0) {
      const tagRelations = tagIds.map((tagId: string) => ({
        post_id: resolvedParams.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("blog_post_tags")
        .insert(tagRelations);

      if (tagError) {
        console.error("태그 연결 실패:", tagError);
      }
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("블로그 글 수정 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 블로그 글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // 태그 관계 먼저 삭제
    await supabase.from("blog_post_tags").delete().eq("post_id", resolvedParams.id);

    // 댓글 삭제
    await supabase.from("blog_comments").delete().eq("post_id", resolvedParams.id);

    // 좋아요 삭제
    await supabase.from("blog_likes").delete().eq("post_id", resolvedParams.id);

    // 블로그 글 삭제
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", resolvedParams.id);

    if (error) {
      console.error("블로그 글 삭제 실패:", error);
      return NextResponse.json({ error: "블로그 글 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("블로그 글 삭제 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}


