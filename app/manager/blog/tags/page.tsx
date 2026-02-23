"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";

interface BlogTag {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function BlogTagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 새 태그 추가
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  
  // 태그 수정
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch("/manager-api/blog/tags");
      const data = await response.json();

      if (response.ok) {
        setTags(data.tags || []);
      } else {
        console.error("태그 로딩 실패:", data.error);
      }
    } catch (error) {
      console.error("태그 로딩 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      alert("태그 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/manager-api/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("태그가 추가되었습니다.");
        setNewTagName("");
        setShowAddForm(false);
        loadTags();
      } else {
        alert("추가 실패: " + data.error);
      }
    } catch (error) {
      console.error("태그 추가 중 오류:", error);
      alert("추가 중 오류가 발생했습니다.");
    }
  };

  const handleEditTag = async (id: string) => {
    if (!editName.trim()) {
      alert("태그 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/manager-api/blog/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          isActive: editActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("태그가 수정되었습니다.");
        setEditingId(null);
        loadTags();
      } else {
        alert("수정 실패: " + data.error);
      }
    } catch (error) {
      console.error("태그 수정 중 오류:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("정말로 이 태그를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/manager-api/blog/tags/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("태그가 삭제되었습니다.");
        loadTags();
      } else {
        const data = await response.json();
        alert("삭제 실패: " + data.error);
      }
    } catch (error) {
      console.error("태그 삭제 중 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const startEdit = (tag: BlogTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditActive(tag.is_active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditActive(true);
  };

  return (
    <div className="min-h-screen">
      <AdminHeader currentPath="/manager/blog/tags" />

      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">태그 관리</h1>
              <p className="text-gray-600 mt-2">
                블로그 글에 사용할 태그를 관리합니다
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <PlusCircle size={20} />
                새 태그 추가
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/manager/blog")}
              >
                블로그 목록으로
              </Button>
            </div>
          </div>
        </div>

        {/* 새 태그 추가 폼 */}
        {showAddForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">새 태그 추가</h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">태그 이름</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="예: 피부과, 성형외과, 논문 리뷰"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddTag}>추가</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTagName("");
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 태그 목록 */}
        {loading ? (
          <div className="text-center py-12">로딩 중...</div>
        ) : tags.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">등록된 태그가 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {tags.map((tag) => (
              <Card key={tag.id} className="p-6">
                {editingId === tag.id ? (
                  // 수정 모드
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">태그 이름</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                        />
                        <span>활성화</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditTag(tag.id)}>
                        저장
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{tag.name}</h3>
                        {tag.is_active ? (
                          <Badge className="bg-green-500">활성</Badge>
                        ) : (
                          <Badge className="bg-gray-500">비활성</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        생성일: {new Date(tag.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(tag)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

