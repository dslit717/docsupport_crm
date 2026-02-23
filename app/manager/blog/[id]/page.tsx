"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminHeader from "@/components/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

interface BlogTag {
  id: string;
  name: string;
}

type PostStatus = "published" | "draft";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  status?: PostStatus | string;
  tags?: BlogTag[];
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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
      if (response.ok) {
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("태그 로딩 실패:", error);
    }
  };

  const loadPost = async () => {
    try {
      setLoadingPost(true);
      console.log("Loading post with ID:", postId);
      const response = await fetch(`/manager-api/blog/posts/${postId}`);
      const data = await response.json();

      console.log("Post load response:", { status: response.status, data });

      if (response.ok) {
        const post: BlogPost = data.post;
        setTitle(post.title);
        setContent(post.content);
        setStatus(
          post.status === "draft" ? "draft" : "published"
        );
        setSelectedTags(post.tags?.map((t) => t.id) || []);
      } else {
        console.error("블로그 글 로딩 실패:", data);
        alert("블로그 글을 찾을 수 없습니다: " + (data.error || "Unknown error"));
        router.push("/manager/blog");
      }
    } catch (error) {
      console.error("블로그 글 로딩 실패:", error);
      alert("블로그 글 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoadingPost(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/manager-api/blog/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
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
        alert("수정 실패: " + data.error);
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
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">블로그 글 수정</h1>
          <p className="text-gray-600">블로그 글을 수정합니다</p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="block">제목</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="block">내용</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={20}
                className="w-full min-h-[300px] resize-none text-base md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="block">공개 설정</Label>
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
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => setStatus("draft")}
                    className="rounded-full border-gray-300"
                  />
                  <span>비공개</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block">태그</Label>
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
              <Button
                onClick={handleSave}
                disabled={loading}
                size="default"
                className="min-w-[100px]"
              >
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

