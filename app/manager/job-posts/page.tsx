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
  MapPin,
  Briefcase,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface JobPost {
  id: string;
  user_id: string;
  title: string;
  hospital_name: string;
  location: string;
  job_type: string;
  salary?: string;
  experience?: string;
  description: string;
  full_description?: string;
  contact_email?: string;
  contact_phone?: string;
  departments: string[];
  is_paid: boolean;
  urgent: boolean;
  status: string;
  views: number;
  paid_ad_approved: boolean;
  paid_ad_approved_at?: string;
  paid_ad_approved_by?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export default function JobPostManagementPage() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [isPaidFilter, setIsPaidFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Load job posts
  const loadJobPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(jobTypeFilter &&
          jobTypeFilter !== "all" && { jobType: jobTypeFilter }),
        ...(isPaidFilter && isPaidFilter !== "all" && { isPaid: isPaidFilter }),
      });

      const response = await fetch(`/manager-api/job-posts?${params}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setJobPosts(result.data || []);
        if (result.pagination) {
          setPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          });
        }
      } else {
        console.error("Failed to load job posts:", result.error);
      }
    } catch (error) {
      console.error("Error loading job posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, statusFilter, jobTypeFilter, isPaidFilter]);

  useEffect(() => {
    loadJobPosts();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    statusFilter,
    jobTypeFilter,
    isPaidFilter,
  ]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch("/manager-api/job-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        alert("상태가 변경되었습니다.");
        loadJobPosts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleApproveAd = async (id: string, approve: boolean) => {
    try {
      const response = await fetch("/manager-api/job-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          paid_ad_approved: approve,
          paid_ad_approved_by: "admin", // TODO: Use actual admin user
        }),
      });

      if (response.ok) {
        alert(
          approve
            ? "유료 광고가 승인되었습니다."
            : "유료 광고가 거부되었습니다."
        );
        loadJobPosts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving ad:", error);
      alert("광고 승인 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/job-posts?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("구인글이 삭제되었습니다.");
        loadJobPosts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting job post:", error);
      alert("구인글 삭제 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">활성</Badge>;
      case "closed":
        return <Badge variant="secondary">마감</Badge>;
      case "deleted":
        return <Badge variant="outline">삭제</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR");
  };

  const openDetailDialog = (job: JobPost) => {
    setSelectedJob(job);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/job-posts" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">구인게시판 관리</h1>
          <p className="text-gray-600 mt-2">의료진 채용 정보를 관리합니다.</p>
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
                    placeholder="제목, 병원명 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="closed">마감</SelectItem>
                    <SelectItem value="deleted">삭제</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="고용형태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="정규직">정규직</SelectItem>
                    <SelectItem value="파트타임">파트타임</SelectItem>
                    <SelectItem value="전공의">전공의</SelectItem>
                    <SelectItem value="인턴">인턴</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={isPaidFilter} onValueChange={setIsPaidFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="유료 광고" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="true">유료</SelectItem>
                    <SelectItem value="false">무료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle>구인글 목록 ({pagination.total}개)</CardTitle>
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
                      <TableHead>병원명</TableHead>
                      <TableHead>위치</TableHead>
                      <TableHead>고용형태</TableHead>
                      <TableHead>진료과</TableHead>
                      <TableHead>조회수</TableHead>
                      <TableHead>유료광고</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobPosts.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.title}</div>
                          {job.urgent && (
                            <Badge
                              variant="destructive"
                              className="text-xs mt-1"
                            >
                              급구
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{job.hospital_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin size={12} />
                            {job.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.job_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {job.departments.slice(0, 2).map((dept, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {dept}
                              </Badge>
                            ))}
                            {job.departments.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{job.departments.length - 2}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye size={12} />
                            {job.views}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.is_paid ? (
                            <div className="space-y-1">
                              <Badge className="bg-yellow-500">유료</Badge>
                              {job.paid_ad_approved ? (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle size={12} />
                                  승인
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() =>
                                      handleApproveAd(job.id, true)
                                    }
                                  >
                                    승인
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() =>
                                      handleApproveAd(job.id, false)
                                    }
                                  >
                                    거부
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary">무료</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(job.status)}
                            {job.status === "active" && (
                              <Select
                                value={job.status}
                                onValueChange={(value) =>
                                  handleStatusChange(job.id, value)
                                }
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">활성</SelectItem>
                                  <SelectItem value="closed">마감</SelectItem>
                                  <SelectItem value="deleted">삭제</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(job.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(job)}
                            >
                              <Eye size={12} />
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
                                    구인글 삭제
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{job.title}" 구인글을 삭제하시겠습니까? 이
                                    작업은 되돌릴 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(job.id)}
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

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>구인글 상세 정보</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedJob.title}</h3>
                  <p className="text-gray-600">{selectedJob.hospital_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">위치</label>
                    <p className="font-medium">{selectedJob.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">고용형태</label>
                    <p className="font-medium">{selectedJob.job_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">급여</label>
                    <p className="font-medium">
                      {selectedJob.salary || "협의"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">경력</label>
                    <p className="font-medium">
                      {selectedJob.experience || "무관"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">진료과</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedJob.departments.map((dept, idx) => (
                      <Badge key={idx} variant="secondary">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">간단 설명</label>
                  <p className="mt-1">{selectedJob.description}</p>
                </div>

                {selectedJob.full_description && (
                  <div>
                    <label className="text-sm text-gray-600">상세 설명</label>
                    <p className="mt-1 whitespace-pre-wrap">
                      {selectedJob.full_description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">이메일</label>
                    <p className="font-medium">
                      {selectedJob.contact_email || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">전화번호</label>
                    <p className="font-medium">
                      {selectedJob.contact_phone || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm text-gray-600">조회수</label>
                    <p className="font-medium">{selectedJob.views}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">등록일</label>
                    <p className="font-medium">
                      {formatDate(selectedJob.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">만료일</label>
                    <p className="font-medium">
                      {selectedJob.expires_at
                        ? formatDate(selectedJob.expires_at)
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
