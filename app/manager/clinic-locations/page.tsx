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
  MapPin,
  Building,
  Ruler,
  Star,
} from "lucide-react";

interface ClinicLocation {
  id: string;
  title: string;
  address: string;
  region: string;
  type: string;
  size_sqm: number;
  floor: string;
  monthly_rent: number;
  deposit: number;
  parking_spaces: number;
  facilities: string[];
  description: string;
  contact_phone: string;
  available_date: string;
  rating: number;
  images: string[];
  is_active: boolean;
  views: number;
  created_at: string;
}

export default function ClinicLocationManagementPage() {
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedLocation, setSelectedLocation] =
    useState<ClinicLocation | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    title: "",
    address: "",
    region: "",
    type: "",
    size_sqm: 0,
    floor: "",
    monthly_rent: 0,
    deposit: 0,
    parking_spaces: 0,
    facilities: [] as string[],
    description: "",
    contact_phone: "",
    available_date: "",
    rating: 0,
    images: [] as string[],
    is_active: true,
  });

  const regions = [
    "전체",
    "서울 강남구",
    "서울 서초구",
    "서울 송파구",
    "부산 해운대구",
    "부산 부산진구",
    "대구 수성구",
    "대구 달서구",
    "인천 연수구",
    "인천 남동구",
    "광주 서구",
    "광주 동구",
    "대전 유성구",
    "대전 서구",
    "울산 남구",
    "경기 성남시",
    "경기 수원시",
    "경기 고양시",
    "경기 용인시",
  ];

  const types = [
    "전체",
    "의원",
    "피부과",
    "치과",
    "내과",
    "소아과",
    "정형외과",
    "산부인과",
    "성형외과",
    "한의원",
  ];

  const facilityOptions = [
    "엘리베이터",
    "주차장",
    "대기실",
    "진료실",
    "수술실",
    "레이저실",
    "시술실",
    "물리치료실",
    "운동치료실",
    "촬영실",
    "소독실",
    "기공실",
    "약재실",
    "침구실",
    "회복실",
    "수유실",
    "놀이공간",
    "사무실",
    "검사실",
  ];

  // Load locations
  const loadLocations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        showAll: "true", // 관리자는 모든 항목 조회
        ...(searchQuery && { search: searchQuery }),
        ...(regionFilter &&
          regionFilter !== "전체" && { region: regionFilter }),
        ...(typeFilter && typeFilter !== "전체" && { type: typeFilter }),
      });

      const response = await fetch(`/manager-api/clinic-locations?${params}`);
      const result = await response.json();

      if (response.ok && result.success) {
        let filteredData = result.data || [];

        // 상태 필터 적용 (클라이언트 측)
        if (statusFilter === "active") {
          filteredData = filteredData.filter(
            (loc: ClinicLocation) => loc.is_active
          );
        } else if (statusFilter === "inactive") {
          filteredData = filteredData.filter(
            (loc: ClinicLocation) => !loc.is_active
          );
        }

        setLocations(filteredData);
        if (result.pagination) {
          setPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          });
        }
      } else {
        console.error("Failed to load clinic locations:", result.error);
      }
    } catch (error) {
      console.error("Error loading clinic locations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, regionFilter, typeFilter, statusFilter]);

  useEffect(() => {
    loadLocations();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    regionFilter,
    typeFilter,
    statusFilter,
  ]);

  const resetForm = () => {
    setFormData({
      title: "",
      address: "",
      region: "",
      type: "",
      size_sqm: 0,
      floor: "",
      monthly_rent: 0,
      deposit: 0,
      parking_spaces: 0,
      facilities: [],
      description: "",
      contact_phone: "",
      available_date: "",
      rating: 0,
      images: [],
      is_active: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (location: ClinicLocation) => {
    setSelectedLocation(location);
    setFormData({
      title: location.title,
      address: location.address,
      region: location.region,
      type: location.type,
      size_sqm: location.size_sqm,
      floor: location.floor,
      monthly_rent: location.monthly_rent,
      deposit: location.deposit,
      parking_spaces: location.parking_spaces,
      facilities: location.facilities || [],
      description: location.description,
      contact_phone: location.contact_phone,
      available_date: location.available_date,
      rating: location.rating,
      images: location.images || [],
      is_active: location.is_active,
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url =
        dialogMode === "create"
          ? "/manager-api/clinic-locations"
          : `/manager-api/clinic-locations/${selectedLocation?.id}`;

      const response = await fetch(url, {
        method: dialogMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "개원자리가 저장되었습니다.");
        setIsDialogOpen(false);
        loadLocations();
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving clinic location:", error);
      alert("개원자리 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/clinic-locations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("개원자리가 비활성화되었습니다.");
        loadLocations();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deactivating clinic location:", error);
      alert("개원자리 비활성화 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/manager-api/clinic-locations/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadLocations();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error toggling clinic location status:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR");
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/clinic-locations" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">개원자리 관리</h1>
          <p className="text-gray-600 mt-2">
            병의원용 부동산 정보를 관리합니다.
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
                    placeholder="제목, 주소 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="지역" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={openCreateDialog} className="gap-2">
                <Plus size={16} />새 개원자리 추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Locations Table */}
        <Card>
          <CardHeader>
            <CardTitle>개원자리 목록 ({pagination.total}개)</CardTitle>
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
                      <TableHead>지역</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>면적</TableHead>
                      <TableHead>월세/보증금</TableHead>
                      <TableHead>평점</TableHead>
                      <TableHead>조회수</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {location.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin size={12} />
                            {location.region}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{location.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Ruler size={12} />
                            {location.size_sqm}㎡
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              월 {location.monthly_rent.toLocaleString()}만원
                            </div>
                            <div className="text-gray-500">
                              보증금 {location.deposit.toLocaleString()}만원
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500" />
                            {location.rating}
                          </div>
                        </TableCell>
                        <TableCell>{location.views}</TableCell>
                        <TableCell>
                          <Button
                            variant={
                              location.is_active ? "default" : "secondary"
                            }
                            size="sm"
                            onClick={() =>
                              handleToggleActive(
                                location.id,
                                location.is_active
                              )
                            }
                            className="cursor-pointer"
                          >
                            {location.is_active ? "활성" : "비활성"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(location.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(location)}
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
                                    개원자리 비활성화
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{location.title}" 개원자리를
                                    비활성화하시겠습니까? 사용자에게 더 이상
                                    표시되지 않습니다. 다시 활성화하려면 수정
                                    기능을 사용하세요.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(location.id)}
                                  >
                                    비활성화
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "새 개원자리 추가" : "개원자리 수정"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">제목 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="예: 강남역 도보 5분 의료용 부동산"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">지역 *</label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) =>
                      setFormData({ ...formData, region: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.slice(1).map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">유형 *</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.slice(1).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">주소 *</label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="예: 서울 강남구 강남대로 396"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">면적 (㎡) *</label>
                  <Input
                    type="number"
                    value={formData.size_sqm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size_sqm: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">층수 *</label>
                  <Input
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({ ...formData, floor: e.target.value })
                    }
                    placeholder="예: 지상1층~2층"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">주차 가능 대수</label>
                  <Input
                    type="number"
                    value={formData.parking_spaces}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parking_spaces: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">월세 (만원) *</label>
                  <Input
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthly_rent: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="800"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">보증금 (만원) *</label>
                  <Input
                    type="number"
                    value={formData.deposit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deposit: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="10000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">시설 정보</label>
                <div className="grid grid-cols-4 gap-2 mt-2 p-3 border rounded-md bg-gray-50">
                  {facilityOptions.map((facility) => (
                    <label
                      key={facility}
                      className="flex items-center space-x-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                        className="rounded"
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">설명 *</label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="개원자리에 대한 상세 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">연락처 *</label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    placeholder="02-1234-5678"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">입주가능일 *</label>
                  <Input
                    type="date"
                    value={formData.available_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        available_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    평점 (0.0 ~ 5.0)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="4.5"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active_location"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="is_active_location"
                    className="text-sm font-medium"
                  >
                    활성화 (사용자에게 표시)
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
