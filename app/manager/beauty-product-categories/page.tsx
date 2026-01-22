"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/manager-api/beauty-product-categories");
      const result = await response.json();

      if (response.ok) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error("카테고리 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async () => {
    try {
      const response = await fetch("/manager-api/beauty-product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          description: formDescription,
          display_order: formDisplayOrder,
          is_active: formIsActive,
        }),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        loadCategories();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("카테고리 생성 오류:", error);
      alert("카테고리 생성 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const response = await fetch(
        `/manager-api/beauty-product-categories/${selectedCategory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            slug: formSlug,
            description: formDescription,
            display_order: formDisplayOrder,
            is_active: formIsActive,
          }),
        }
      );

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedCategory(null);
        loadCategories();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("카테고리 수정 오류:", error);
      alert("카테고리 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(
        `/manager-api/beauty-product-categories/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        loadCategories();
      } else {
        const result = await response.json();
        alert(result.error || "카테고리 삭제 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("카테고리 삭제 오류:", error);
      alert("카테고리 삭제 중 오류가 발생했습니다.");
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description || "");
    setFormDisplayOrder(category.display_order);
    setFormIsActive(category.is_active);
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormDisplayOrder(0);
    setFormIsActive(true);
    setIsCreateDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-가-힣]/g, "");
    setFormSlug(slug);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/beauty-product-categories" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                제품 카테고리 관리
              </h1>
              <p className="text-gray-600 mt-2">
                제품 카테고리를 생성하고 관리할 수 있습니다.
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus size={16} />새 카테고리 추가
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>카테고리 목록 ({categories.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>카테고리명</TableHead>
                    <TableHead>슬러그</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>표시 순서</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {category.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell>
                        <Badge
                          variant={category.is_active ? "default" : "secondary"}
                        >
                          {category.is_active ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit size={12} />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 size={12} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  카테고리 삭제
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{category.name}" 카테고리를 삭제하시겠습니까?
                                  이 카테고리를 사용하는 제품이 있으면 삭제할 수
                                  없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCategory(category.id)
                                  }
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>새 카테고리 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">카테고리명 *</label>
                <Input
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="카테고리명을 입력하세요"
                />
              </div>

              <div>
                <label className="text-sm font-medium">슬러그 *</label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="URL에 사용될 슬러그"
                />
                <p className="text-xs text-gray-500 mt-1">
                  카테고리명을 입력하면 자동으로 생성됩니다.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">설명</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="카테고리 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="text-sm font-medium">표시 순서</label>
                <Input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) =>
                    setFormDisplayOrder(parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  숫자가 작을수록 먼저 표시됩니다.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_create"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="is_active_create"
                  className="text-sm font-medium"
                >
                  활성화
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleCreateCategory}>생성</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>카테고리 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">카테고리명 *</label>
                <Input
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="카테고리명을 입력하세요"
                />
              </div>

              <div>
                <label className="text-sm font-medium">슬러그 *</label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="URL에 사용될 슬러그"
                />
                <p className="text-xs text-gray-500 mt-1">
                  카테고리명을 입력하면 자동으로 생성됩니다.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">설명</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="카테고리 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="text-sm font-medium">표시 순서</label>
                <Input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) =>
                    setFormDisplayOrder(parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  숫자가 작을수록 먼저 표시됩니다.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="is_active_edit" className="text-sm font-medium">
                  활성화
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleUpdateCategory}>수정</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
