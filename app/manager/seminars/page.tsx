"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";

interface Seminar {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  time: string;
  participants: number;
  fee: string;
  organizer: string;
  description: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

export default function SeminarManagementPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    date: "",
    time: "",
    participants: 0,
    fee: "",
    organizer: "",
    description: "",
    status: "upcoming",
    is_active: true,
  });

  const categories = [
    "전체",
    "성형외과",
    "피부과",
    "내과",
    "치과",
    "소아청소년과",
    "정형외과",
    "산부인과",
    "응급의학",
    "정신건강의학과",
    "안과",
    "이비인후과",
    "가정의학과",
    "영상의학과",
    "재활의학과",
    "병리과",
  ];

  // Load seminars
  const loadSeminars = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter &&
          categoryFilter !== "전체" && { category: categoryFilter }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/manager-api/seminars?${params}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setSeminars(result.data || []);
        if (result.pagination) {
          setPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          });
        }
      } else {
        console.error("Failed to load seminars:", result.error);
      }
    } catch (error) {
      console.error("Error loading seminars:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    loadSeminars();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    categoryFilter,
    statusFilter,
  ]);

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      location: "",
      date: "",
      time: "",
      participants: 0,
      fee: "",
      organizer: "",
      description: "",
      status: "upcoming",
      is_active: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (seminar: Seminar) => {
    setSelectedSeminar(seminar);
    setFormData({
      title: seminar.title,
      category: seminar.category,
      location: seminar.location,
      date: seminar.date,
      time: seminar.time,
      participants: seminar.participants,
      fee: seminar.fee,
      organizer: seminar.organizer,
      description: seminar.description,
      status: seminar.status,
      is_active: seminar.is_active,
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url =
        dialogMode === "create"
          ? "/manager-api/seminars"
          : `/manager-api/seminars/${selectedSeminar?.id}`;

      const response = await fetch(url, {
        method: dialogMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "세미나가 저장되었습니다.");
        setIsDialogOpen(false);
        loadSeminars();
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving seminar:", error);
      alert("세미나 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/seminars/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("세미나가 삭제되었습니다.");
        loadSeminars();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting seminar:", error);
      alert("세미나 삭제 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return <Badge className="bg-green-500">진행중</Badge>;
      case "upcoming":
        return <Badge variant="secondary">예정</Badge>;
      case "ended":
        return <Badge variant="outline">종료</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/seminars" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">세미나 관리</h1>
          <p className="text-gray-600 mt-2">
            학회 및 세미나 정보를 관리합니다.
          </p>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    placeholder="세미나명, 주최기관 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="진료과목" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="upcoming">예정</SelectItem>
                    <SelectItem value="ongoing">진행중</SelectItem>
                    <SelectItem value="ended">종료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={openCreateDialog} className="gap-2">
                <Plus size={16} />새 세미나 추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seminars Table */}
        <Card>
          <CardHeader>
            <CardTitle>세미나 목록 ({pagination.total}개)</CardTitle>
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
                      <TableHead>제목</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>장소</TableHead>
                      <TableHead>일시</TableHead>
                      <TableHead>주최</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>활성</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seminars.map((seminar) => (
                      <TableRow key={seminar.id}>
                        <TableCell className="font-medium">
                          {seminar.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{seminar.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin size={12} />
                            {seminar.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(seminar.date)}
                            </div>
                            <div className="text-gray-500">{seminar.time}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {seminar.organizer}
                        </TableCell>
                        <TableCell>{getStatusBadge(seminar.status)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              seminar.is_active ? "default" : "secondary"
                            }
                          >
                            {seminar.is_active ? "활성" : "비활성"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(seminar)}
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
                                    세미나 삭제
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{seminar.title}" 세미나를 삭제하시겠습니까?
                                    이 작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(seminar.id)}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
              >
                이전
              </Button>
              <span className="px-4 py-2 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "새 세미나 추가" : "세미나 수정"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">세미나명 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="세미나 제목을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">카테고리 *</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">주최기관 *</label>
                  <Input
                    value={formData.organizer}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer: e.target.value })
                    }
                    placeholder="주최기관"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">장소 *</label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="예: 서울 코엑스"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">날짜 *</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">시간 *</label>
                  <Input
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    placeholder="예: 09:00 - 18:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">참가인원</label>
                  <Input
                    type="number"
                    value={formData.participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        participants: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="예: 100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">참가비</label>
                  <Input
                    value={formData.fee}
                    onChange={(e) =>
                      setFormData({ ...formData, fee: e.target.value })
                    }
                    placeholder="예: 무료 또는 10만원"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">설명</label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="세미나 상세 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">상태 *</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">예정</SelectItem>
                      <SelectItem value="ongoing">진행중</SelectItem>
                      <SelectItem value="ended">종료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active_seminar"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="is_active_seminar"
                    className="text-sm font-medium"
                  >
                    활성화
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {dialogMode === "create" ? "생성" : "수정"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
