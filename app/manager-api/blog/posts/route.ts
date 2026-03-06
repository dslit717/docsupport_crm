import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/server/auth-utils";

// 블로그 글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tag = searchParams.get("tag");
    const q = searchParams.get("q")?.trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("blog_posts")
      .select(
        `
        *,
        tags:blog_post_tags(
          tag:blog_tags(*)
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    }
    if (tag) {
      query = query.contains("blog_post_tags.tag_id", [tag]);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("블로그 글 조회 실패:", error);
      return NextResponse.json({ error: "블로그 글 조회 실패" }, { status: 500 });
    }

    const formattedPosts = (data || []).map((post: any) => ({
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
    }));

    return NextResponse.json({
      posts: formattedPosts,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("블로그 글 조회 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 블로그 글 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, status, tagIds } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용은 필수입니다" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const meta = authResult.user.user_metadata as { full_name?: string; name?: string } | undefined;
    const authorName =
      meta?.full_name || meta?.name || authResult.user.email?.split("@")[0] || "관리자";

    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .insert({
        title,
        content,
        status: status || "draft",
        author_id: authResult.user.id,
        author_name: authorName,
      })
      .select()
      .single();

    if (postError) {
      console.error("블로그 글 생성 실패:", postError);
      return NextResponse.json({ error: "블로그 글 생성 실패" }, { status: 500 });
    }

    if (tagIds && tagIds.length > 0) {
      const tagRelations = tagIds.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("blog_post_tags")
        .insert(tagRelations);

      if (tagError) {
        console.error("태그 연결 실패:", tagError);
      }
    }

    const docsupportUrl = process.env.DOCSUPPORT_SITE_URL || "https://docsupport.kr";
    const blogAdminKey = process.env.BLOG_ADMIN_API_KEY;
    let notify: { called: boolean; ok?: boolean; status?: number; subscriberCount?: number; sentCount?: number; reason?: string; error?: string } = { called: false };

    if (status === "published" && tagIds?.length > 0) {
      if (!blogAdminKey) {
        notify = { called: false, reason: "BLOG_ADMIN_API_KEY 미설정. CRM .env 또는 Vercel(CRM 프로젝트) 환경 변수에 추가하세요." };
      } else {
        try {
          const res = await fetch(`${docsupportUrl}/api/blog/notify-subscribers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-key": blogAdminKey },
            body: JSON.stringify({ post_id: post.id }),
          });
          const data = await res.json().catch(() => ({}));
          notify = {
            called: true,
            ok: res.ok,
            status: res.status,
            subscriberCount: data.subscriberCount,
            sentCount: data.sentCount,
            reason: data.reason ?? data.message,
            error: data.error,
          };
          if (!res.ok) console.error("알림 API 실패:", res.status, data);
        } catch (err) {
          notify = { called: true, ok: false, error: err instanceof Error ? err.message : "네트워크 오류" };
          console.error("알림 API 호출 오류:", err);
        }
      }
    }

    return NextResponse.json({ success: true, post, notify });
  } catch (error) {
    console.error("블로그 글 생성 중 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
