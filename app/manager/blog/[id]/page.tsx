"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminHeader from "@/components/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";

interface BlogTag {
  id: string;
  name: string;
}

type PostStatus = "published" | "hided";

/** 블로그 content jsonb 구조 */
export interface PostingBody {
  title: string;
  content: string;
}

export interface BlogContentData {
  doi?: string;
  title?: string;
  abstract?: string;
  post_title?: string;
  introduction?: string;
  citation_count?: number;
  posting_bodies?: PostingBody[];
  post_conclusion?: string;
  post_application?: string;
  post_introduction?: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string | BlogContentData;
  status?: PostStatus | string;
  tags?: BlogTag[];
}

const defaultContent = (): BlogContentData => ({
  doi: "",
  title: "",
  abstract: "",
  post_title: "",
  introduction: "",
  citation_count: 0,
  posting_bodies: [{ title: "", content: "" }],
  post_conclusion: "",
  post_application: "",
  post_introduction: "",
});

function parseContent(raw: string | BlogContentData | null | undefined): BlogContentData {
  if (raw == null) return defaultContent();
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as BlogContentData;
      if (typeof parsed === "object" && parsed !== null) return { ...defaultContent(), ...parsed };
    } catch {
      return { ...defaultContent(), post_introduction: raw };
    }
    return defaultContent();
  }
  return {
    ...defaultContent(),
    ...raw,
    posting_bodies:
      Array.isArray(raw.posting_bodies) && raw.posting_bodies.length > 0
        ? raw.posting_bodies.map((b) => ({ title: b?.title ?? "", content: b?.content ?? "" }))
        : defaultContent().posting_bodies,
  };
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [content, setContent] = useState<BlogContentData>(defaultContent());
  const [status, setStatus] = useState<PostStatus>("published");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    loadTags();
    loadPost();
  }, [postId]);

  const loadTags = async () => {
    try {
      const response = await fetch("/manager-api/blog/tags");
      const data = await response.json();
      if (response.ok) setTags(data.tags || []);
    } catch (error) {
      console.error("태그 로딩 실패:", error);
    }
  };

  const loadPost = async () => {
    try {
      setLoadingPost(true);
      const response = await fetch(`/manager-api/blog/posts/${postId}`);
      const data = await response.json();

      if (response.ok) {
        const post: BlogPost = data.post;
        const parsed = parseContent(post.content);
        setContent({
          ...parsed,
          post_title: parsed.post_title?.trim() || post.title || "",
        });
        setStatus(post.status === "hided" ? "hided" : "published");
        setSelectedTags(post.tags?.map((t) => t.id) || []);
      } else {
        alert("블로그 글을 찾을 수 없습니다: " + (data.error || ""));
        router.push("/manager/blog");
      }
    } catch (error) {
      console.error("블로그 글 로딩 실패:", error);
      alert("블로그 글 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoadingPost(false);
    }
  };

  const updateContent = <K extends keyof BlogContentData>(key: K, value: BlogContentData[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const setPostingBody = (index: number, field: "title" | "content", value: string) => {
    setContent((prev) => {
      const list = [...(prev.posting_bodies || [{ title: "", content: "" }])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, posting_bodies: list };
    });
  };

  const addPostingBody = () => {
    setContent((prev) => ({
      ...prev,
      posting_bodies: [...(prev.posting_bodies || []), { title: "", content: "" }],
    }));
  };

  const removePostingBody = (index: number) => {
    setContent((prev) => {
      const list = (prev.posting_bodies || []).filter((_, i) => i !== index);
      return { ...prev, posting_bodies: list.length ? list : [{ title: "", content: "" }] };
    });
  };

  const handleSave = async () => {
    if (!content.post_title?.trim()) {
      alert("포스팅 제목을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/manager-api/blog/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: content.post_title?.trim() ?? "",
          content,
          status,
          tagIds: selectedTags,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("블로그 글이 수정되었습니다.");
        router.push("/manager/blog");
      } else {
        alert("수정 실패: " + (data?.error ?? ""));
      }
    } catch (error) {
      console.error("수정 중 오류:", error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const postingBodies = content.posting_bodies || [{ title: "", content: "" }];

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader currentPath="/manager/blog" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader currentPath="/manager/blog" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">블로그 글 수정</h1>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>포스팅 제목</Label>
              <Input
                value={content.post_title ?? ""}
                onChange={(e) => updateContent("post_title", e.target.value)}
                placeholder="포스팅 제목"
                className="w-full"
              />
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-2">
              <Label>논문제목</Label>
              <Input
                value={content.title ?? ""}
                onChange={(e) => updateContent("title", e.target.value)}
                placeholder="논문제목"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>논문 인용 횟수</Label>
              <Input
                type="number"
                value={content.citation_count ?? 0}
                onChange={(e) => updateContent("citation_count", parseInt(e.target.value, 10) || 0)}
                placeholder="논문 인용 횟수"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>포스팅 도입부</Label>
              <Textarea
                value={content.post_introduction ?? ""}
                onChange={(e) => updateContent("post_introduction", e.target.value)}
                placeholder="포스팅 도입부"
                rows={5}
                className="w-full resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>논문도입부</Label>
              <Textarea
                value={content.introduction ?? ""}
                onChange={(e) => updateContent("introduction", e.target.value)}
                placeholder="논문도입부"
                rows={4}
                className="w-full resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>논문요약</Label>
              <Textarea
                value={content.abstract ?? ""}
                onChange={(e) => updateContent("abstract", e.target.value)}
                placeholder="논문요약"
                rows={4}
                className="w-full resize-y"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>포스팅 본문</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPostingBody}>
                  <PlusCircle className="w-4 h-4 mr-1" />
                  블록 추가
                </Button>
              </div>
              {postingBodies.map((body, index) => (
                <Card key={index} className="p-4 space-y-2 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">포스팅 본문 {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePostingBody(index)}
                      disabled={postingBodies.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Input
                    value={body.title}
                    onChange={(e) => setPostingBody(index, "title", e.target.value)}
                    placeholder="포스팅 본문"
                    className="w-full"
                  />
                  <Textarea
                    value={body.content}
                    onChange={(e) => setPostingBody(index, "content", e.target.value)}
                    placeholder="포스팅 본문"
                    rows={5}
                    className="w-full resize-y"
                  />
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label>포스팅 결론부</Label>
              <Textarea
                value={content.post_conclusion ?? ""}
                onChange={(e) => updateContent("post_conclusion", e.target.value)}
                placeholder="포스팅 결론부"
                rows={4}
                className="w-full resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>포스팅 적용부</Label>
              <Textarea
                value={content.post_application ?? ""}
                onChange={(e) => updateContent("post_application", e.target.value)}
                placeholder="포스팅 적용부"
                rows={4}
                className="w-full resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>논문doi</Label>
              <Input
                value={content.doi ?? ""}
                onChange={(e) => updateContent("doi", e.target.value)}
                placeholder="논문doi"
                className="w-full"
              />
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-2">
              <Label>공개 설정</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === "published"}
                    onChange={() => setStatus("published")}
                    className="rounded-full border-gray-300"
                  />
                  <span>공개</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="hided"
                    checked={status === "hided"}
                    onChange={() => setStatus("hided")}
                    className="rounded-full border-gray-300"
                  />
                  <span>비공개</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>태그</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={handleSave} disabled={loading} size="default" className="min-w-[100px]">
                {loading ? "저장 중..." : "저장"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                className="min-w-[100px]"
                onClick={() => router.push("/manager/blog")}
              >
                취소
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
