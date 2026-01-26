"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminHeader from "@/components/admin-header";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Filter,
  ArrowUpDown,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  vendor_count: number;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
}

export default function VendorCategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categoryVendors, setCategoryVendors] = useState<Vendor[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [uncategorizedVendorIds, setUncategorizedVendorIds] = useState<
    Set<string>
  >(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 폼 상태
  const [formOpen, setFormOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sortField,
        sortDirection,
      });

      const response = await fetch(`/manager-api/vendor-categories?${params}`);
      const result = await response.json();

      if (response.ok) {
        setCategories(result.data || []);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("카테고리 로드 오류:", error);
      alert("카테고리를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 특정 카테고리의 업체 목록 로드
  const loadCategoryVendors = async (categoryId: string) => {
    try {
      const response = await fetch(
        `/manager-api/vendor-categories/${categoryId}`
      );
      const result = await response.json();

      if (response.ok) {
        setCategoryVendors(result.data.vendors || []);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("카테고리 업체 로드 오류:", error);
      alert("업체 목록을 불러오는데 실패했습니다.");
    }
  };

  // 전체 업체 목록 로드 (카테고리 추가용)
  const loadAvailableVendors = async () => {
    try {
      const response = await fetch(`/manager-api/vendors?limit=1000`);
      const result = await response.json();

      if (response.ok) {
        setAvailableVendors(result.data || []);

        // 카테고리 미지정 업체 찾기
        const allVendorIds = new Set<string>(
          (result.data || []).map((v: Vendor) => v.id)
        );

        // 모든 카테고리 매핑 조회
        const mappingResponse = await fetch(
          `/manager-api/vendor-categories?limit=1000`
        );
        const mappingResult = await mappingResponse.json();

        // 카테고리가 있는 업체 ID 수집
        const categorizedVendorIds = new Set<string>();
        for (const category of mappingResult.data || []) {
          const categoryDetailResponse = await fetch(
            `/manager-api/vendor-categories/${category.id}`
          );
          const categoryDetail = await categoryDetailResponse.json();

          if (categoryDetail.data?.vendors) {
            categoryDetail.data.vendors.forEach((v: Vendor) => {
              categorizedVendorIds.add(v.id);
            });
          }
        }

        // 카테고리가 없는 업체 ID만 필터링
        const uncategorized = new Set<string>(
          Array.from(allVendorIds).filter((id: string) => !categorizedVendorIds.has(id))
        );

        setUncategorizedVendorIds(uncategorized);
      }
    } catch (error) {
      console.error("업체 목록 로드 오류:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [searchTerm, sortField, sortDirection]);

  // 카테고리 생성/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/manager-api/vendor-categories/${editingId}`
        : `/manager-api/vendor-categories`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          editingId
            ? "카테고리가 수정되었습니다."
            : "카테고리가 생성되었습니다."
        );
        setFormOpen(false);
        resetForm();
        loadCategories();
      } else {
        const errorMsg = result.error || result.details || "알 수 없는 오류";
        console.error("카테고리 저장 오류:", result);
        alert(`오류: ${errorMsg}`);
      }
    } catch (error) {
      console.error("카테고리 저장 오류:", error);
      alert("카테고리 저장에 실패했습니다.");
    }
  };

  // 카테고리 삭제
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/vendor-categories/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        loadCategories();
      } else {
        const errorMsg = result.error || result.details || "알 수 없는 오류";
        console.error("카테고리 삭제 오류:", result);
        alert(`오류: ${errorMsg}`);
      }
    } catch (error) {
      console.error("카테고리 삭제 오류:", error);
      alert("카테고리 삭제에 실패했습니다.");
    }
  };

  // 카테고리에 업체 추가
  const handleAddVendors = async () => {
    if (!selectedCategory || selectedVendorIds.length === 0) {
      alert("업체를 선택해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `/manager-api/vendor-categories/${selectedCategory.id}/vendors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor_ids: selectedVendorIds }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setVendorDialogOpen(false);
        setSelectedVendorIds([]);
        loadCategoryVendors(selectedCategory.id);
        loadCategories();
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("업체 추가 오류:", error);
      alert("업체 추가에 실패했습니다.");
    }
  };

  // 카테고리에서 업체 제거
  const handleRemoveVendor = async (vendorId: string) => {
    if (!selectedCategory) return;

    try {
      const response = await fetch(
        `/manager-api/vendor-categories/${selectedCategory.id}/vendors?vendor_id=${vendorId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        loadCategoryVendors(selectedCategory.id);
        loadCategories();
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("업체 제거 오류:", error);
      alert("업체 제거에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
  };

  const openEditDialog = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setEditingId(category.id);
    setFormOpen(true);
  };

  const openVendorDialog = (category: Category) => {
    setSelectedCategory(category);
    loadCategoryVendors(category.id);
    loadAvailableVendors();
    setVendorDialogOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/vendor-categories" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-2">업체 카테고리 관리</h1>
          <p className="text-gray-600">
            업체 카테고리를 생성하고 각 카테고리에 업체를 연결할 수 있습니다.
          </p>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="카테고리 이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => loadCategories()} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  검색
                </Button>
              </div>
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm();
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    카테고리 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "카테고리 수정" : "카테고리 추가"}
                    </DialogTitle>
                    <DialogDescription>
                      카테고리 정보를 입력해주세요.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">카테고리 이름 *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">설명</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormOpen(false);
                          resetForm();
                        }}
                      >
                        취소
                      </Button>
                      <Button type="submit">
                        {editingId ? "수정" : "생성"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리 테이블 */}
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          카테고리명
                          {sortField === "name" && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          연결된 업체 수
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center gap-1">
                          생성일
                          {sortField === "created_at" && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md truncate text-sm text-gray-600">
                            {category.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {category.vendor_count}개
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openVendorDialog(category)}
                            >
                              <Users className="h-3 w-3 mr-1" />
                              업체 관리
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    카테고리 삭제
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{category.name}" 카테고리를
                                    삭제하시겠습니까?
                                    <br />
                                    연결된 {category.vendor_count}개의 업체는
                                    미지정 상태로 변경됩니다.
                                    <br />이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(category.id)}
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* 업체 관리 다이얼로그 */}
        <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCategory?.name} - 업체 관리</DialogTitle>
              <DialogDescription>
                이 카테고리에 업체를 추가하거나 제거할 수 있습니다.
              </DialogDescription>
            </DialogHeader>

            {/* 현재 연결된 업체 */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  현재 연결된 업체 ({categoryVendors.length}개)
                </h4>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {categoryVendors.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      연결된 업체가 없습니다.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>업체명</TableHead>
                          <TableHead>연락처</TableHead>
                          <TableHead>위치</TableHead>
                          <TableHead className="text-center">작업</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryVendors.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell>{vendor.name}</TableCell>
                            <TableCell>{vendor.phone || "-"}</TableCell>
                            <TableCell>
                              {vendor.address || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveVendor(vendor.id)}
                              >
                                제거
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              {/* 업체 추가 */}
              <div>
                <h4 className="font-semibold mb-2">업체 추가</h4>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {/* 카테고리 미지정 업체 섹션 */}
                  {availableVendors.filter(
                    (v) =>
                      !categoryVendors.some((cv) => cv.id === v.id) &&
                      uncategorizedVendorIds.has(v.id)
                  ).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                        <Badge variant="destructive" className="text-xs">
                          카테고리 미지정
                        </Badge>
                        <span className="text-sm text-gray-600">
                          (
                          {
                            availableVendors.filter(
                              (v) =>
                                !categoryVendors.some((cv) => cv.id === v.id) &&
                                uncategorizedVendorIds.has(v.id)
                            ).length
                          }
                          개)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {availableVendors
                          .filter(
                            (v) =>
                              !categoryVendors.some((cv) => cv.id === v.id) &&
                              uncategorizedVendorIds.has(v.id)
                          )
                          .map((vendor) => (
                            <div
                              key={vendor.id}
                              className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded border-l-2 border-orange-300"
                            >
                              <input
                                type="checkbox"
                                id={`vendor-${vendor.id}`}
                                checked={selectedVendorIds.includes(vendor.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedVendorIds([
                                      ...selectedVendorIds,
                                      vendor.id,
                                    ]);
                                  } else {
                                    setSelectedVendorIds(
                                      selectedVendorIds.filter(
                                        (id) => id !== vendor.id
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <label
                                htmlFor={`vendor-${vendor.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">{vendor.name}</div>
                                <div className="text-sm text-gray-600">
                                  {vendor.phone || "-"} |{" "}
                                  {vendor.address || "-"}
                                </div>
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 카테고리가 있는 업체 섹션 */}
                  {availableVendors.filter(
                    (v) =>
                      !categoryVendors.some((cv) => cv.id === v.id) &&
                      !uncategorizedVendorIds.has(v.id)
                  ).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                        <Badge variant="secondary" className="text-xs">
                          다른 카테고리 소속
                        </Badge>
                        <span className="text-sm text-gray-600">
                          (
                          {
                            availableVendors.filter(
                              (v) =>
                                !categoryVendors.some((cv) => cv.id === v.id) &&
                                !uncategorizedVendorIds.has(v.id)
                            ).length
                          }
                          개)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {availableVendors
                          .filter(
                            (v) =>
                              !categoryVendors.some((cv) => cv.id === v.id) &&
                              !uncategorizedVendorIds.has(v.id)
                          )
                          .map((vendor) => (
                            <div
                              key={vendor.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                            >
                              <input
                                type="checkbox"
                                id={`vendor-${vendor.id}`}
                                checked={selectedVendorIds.includes(vendor.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedVendorIds([
                                      ...selectedVendorIds,
                                      vendor.id,
                                    ]);
                                  } else {
                                    setSelectedVendorIds(
                                      selectedVendorIds.filter(
                                        (id) => id !== vendor.id
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <label
                                htmlFor={`vendor-${vendor.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">{vendor.name}</div>
                                <div className="text-sm text-gray-600">
                                  {vendor.phone || "-"} |{" "}
                                  {vendor.address || "-"}
                                </div>
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 추가할 업체가 없는 경우 */}
                  {availableVendors.filter(
                    (v) => !categoryVendors.some((cv) => cv.id === v.id)
                  ).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      추가할 수 있는 업체가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVendorDialogOpen(false);
                  setSelectedVendorIds([]);
                  setSelectedCategory(null);
                }}
              >
                닫기
              </Button>
              <Button
                onClick={handleAddVendors}
                disabled={selectedVendorIds.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                선택한 업체 추가 ({selectedVendorIds.length}개)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
