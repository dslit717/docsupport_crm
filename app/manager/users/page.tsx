"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Phone,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  nickname: string | null;
  provider: string | null;
  role: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  phone_number: string | null;
  telecom: string | null;
  doctor_license_number: string | null;
  is_doctor_verified: boolean | null;
  is_phone_verified: boolean | null;
  user_info_name: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorVerifiedFilter, setDoctorVerifiedFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  
  // 의사 인증 변경 다이얼로그
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // 리스트에서 원클릭 인증 변경
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 유저 목록 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(doctorVerifiedFilter !== "all" && { doctor_verified: doctorVerifiedFilter }),
        ...(isActiveFilter !== "all" && { is_active: isActiveFilter }),
      });

      const response = await fetch(`/manager-api/users?${params}`);
      const result = await response.json();

      if (response.ok) {
        setUsers(result.data || []);
        setPagination((prev) => ({
          ...prev,
          total: result.count || 0,
          totalPages: result.totalPages || Math.ceil((result.count || 0) / prev.limit),
        }));
      } else {
        console.error("유저 목록 로드 실패:", result.error);
      }
    } catch (error) {
      console.error("유저 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, doctorVerifiedFilter, isActiveFilter]);

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.limit, searchQuery, doctorVerifiedFilter, isActiveFilter]);

  // 의사 인증 상태 변경
  const handleDoctorVerificationChange = async (verified: boolean) => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      console.log("[의사 인증 변경] 요청:", { userId: selectedUser.id, verified });
      
      const response = await fetch(`/manager-api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_doctor_verified: verified }),
      });

      const result = await response.json();
      console.log("[의사 인증 변경] 응답:", { status: response.status, result });

      if (response.ok) {
        // 로컬 상태 업데이트
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, is_doctor_verified: verified } : u
          )
        );
        setIsDialogOpen(false);
        setSelectedUser(null);
      } else {
        const errorMessage = result.error || result.message || "알 수 없는 오류";
        const errorDetails = result.details || "";
        console.error("[의사 인증 변경] 오류:", { status: response.status, result });
        alert(`오류 (${response.status})\n\n${errorMessage}${errorDetails ? `\n상세: ${errorDetails}` : ""}`);
      }
    } catch (error: any) {
      console.error("[의사 인증 변경] 예외:", error);
      alert(`의사 인증 상태 변경 중 오류가 발생했습니다.\n\n${error?.message || error}`);
    } finally {
      setUpdating(false);
    }
  };

  // 다이얼로그 열기
  const openVerificationDialog = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // 리스트에서 원클릭 인증 토글
  const handleQuickVerificationToggle = async (user: User) => {
    const newVerified = !user.is_doctor_verified;
    
    setUpdatingUserId(user.id);
    try {
      const response = await fetch(`/manager-api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_doctor_verified: newVerified }),
      });

      const result = await response.json();

      if (response.ok) {
        // 로컬 상태 업데이트
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_doctor_verified: newVerified } : u
          )
        );
      } else {
        const errorMessage = result.error || result.message || "알 수 없는 오류";
        console.error("[원클릭 인증 변경] 오류:", { status: response.status, result });
        alert(`인증 상태 변경 실패: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("[원클릭 인증 변경] 예외:", error);
      alert(`인증 상태 변경 중 오류: ${error?.message || error}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/users" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">유저 관리</h1>
          <p className="text-gray-600 mt-2">
            사용자 정보를 조회하고 의사 인증 상태를 관리할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>유저 목록</CardTitle>
                  <CardDescription>
                    총 {pagination.total}명 중 {users.length}명 표시
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadUsers()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  새로고침
                </Button>
              </div>
              
              {/* 필터 영역 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="이름, 닉네임, 전화번호 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={doctorVerifiedFilter} onValueChange={setDoctorVerifiedFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="의사 인증" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="true">인증됨</SelectItem>
                      <SelectItem value="false">미인증</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="true">활성</SelectItem>
                      <SelectItem value="false">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                검색 결과가 없습니다.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>이름/닉네임</TableHead>
                        <TableHead>연락처</TableHead>
                        <TableHead>면허번호</TableHead>
                        <TableHead>의사 인증</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>가입일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.name || user.user_info_name || "-"}
                              </div>
                              {user.nickname && (
                                <div className="text-sm text-gray-500">
                                  @{user.nickname}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {user.phone_number ? (
                                <>
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">{user.phone_number}</span>
                                  {user.is_phone_verified && (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {user.doctor_license_number || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleQuickVerificationToggle(user)}
                              disabled={updatingUserId === user.id}
                              className="cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-not-allowed"
                              title={user.is_doctor_verified ? "클릭하여 인증 취소" : "클릭하여 인증 승인"}
                            >
                              {updatingUserId === user.id ? (
                                <Badge variant="outline" className="gap-1">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  처리중
                                </Badge>
                              ) : user.is_doctor_verified ? (
                                <Badge className="bg-green-100 text-green-800 gap-1 hover:bg-green-200">
                                  <UserCheck className="h-3 w-3" />
                                  인증됨
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1 hover:bg-gray-200">
                                  <UserX className="h-3 w-3" />
                                  미인증
                                </Badge>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-blue-100 text-blue-800">활성</Badge>
                            ) : (
                              <Badge variant="secondary">비활성</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(user.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 페이지네이션 */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      페이지 {pagination.page} / {pagination.totalPages}
                    </p>
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
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.min(prev.totalPages, prev.page + 1),
                          }))
                        }
                        disabled={pagination.page === pagination.totalPages}
                      >
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 의사 인증 관리 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>의사 인증 관리</DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.nickname || "유저"}의 의사 인증 상태를 변경합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 유저 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">이름</span>
                <span className="font-medium">{selectedUser?.name || selectedUser?.user_info_name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">닉네임</span>
                <span className="font-medium">{selectedUser?.nickname || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">전화번호</span>
                <span className="font-medium">{selectedUser?.phone_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">의사면허번호</span>
                <span className="font-medium">{selectedUser?.doctor_license_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">현재 인증 상태</span>
                {selectedUser?.is_doctor_verified ? (
                  <Badge className="bg-green-100 text-green-800">인증됨</Badge>
                ) : (
                  <Badge variant="secondary">미인증</Badge>
                )}
              </div>
            </div>

            {/* 인증 변경 버튼 */}
            <div className="flex gap-3">
              {selectedUser?.is_doctor_verified ? (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDoctorVerificationChange(false)}
                  disabled={updating}
                >
                  {updating ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  인증 취소
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleDoctorVerificationChange(true)}
                  disabled={updating}
                >
                  {updating ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  의사 인증 승인
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

