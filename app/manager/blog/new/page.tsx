"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

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

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/manager-api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          status: "published",
          tagIds: selectedTags,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("블로그 글이 저장되었습니다.");
        router.push("/manager/blog");
      } else {
        alert("저장 실패: " + data.error);
      }
    } catch (error) {
      console.error("저장 중 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
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

  return (
    <div className="min-h-screen">
      <AdminHeader currentPath="/manager/blog" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">새 블로그 글 작성</h1>
          <p className="text-gray-600">
            제목과 내용을 입력한 뒤 저장하세요.
          </p>
        </div>

        {/* 블로그 글 작성 폼 */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label className="block">제목</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full"
              />
            </div>

            {/* 내용 */}
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

            {/* 태그 선택 */}
            <div className="space-y-2">
              <Label className="block">태그</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
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

            {/* 버튼 */}
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

