"use client";

import { useState, useEffect } from "react";
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
import { Search, Calendar, Filter, Download, RefreshCw } from "lucide-react";
import AdminHeader from "@/components/admin-header";

interface AdvertisementLog {
  id: string;
  vendor_id: string;
  action: string;
  previous_expires_at: string | null;
  new_expires_at: string | null;
  previous_tier: string | null;
  new_tier: string | null;
  previous_priority_score: number | null;
  new_priority_score: number | null;
  duration_days: number | null;
  reason: string | null;
  created_by: string;
  created_at: string;
  vendors: {
    id: string;
    name: string;
  };
}

export default function AdvertisementLogsPage() {
  const [logs, setLogs] = useState<AdvertisementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vendor_name: "",
    action: "",
    start_date: "",
    end_date: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 광고 로그 목록 로드
  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.vendor_name && { vendor_name: filters.vendor_name }),
        ...(filters.action &&
          filters.action !== "all" && { action: filters.action }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });

      const response = await fetch(`/manager-api/advertisement-logs?${params}`);
      const result = await response.json();

      if (response.ok) {
        setLogs(result.data);
        setPagination(result.pagination);
      } else {
        console.error("광고 로그 로드 오류:", result.error);
      }
    } catch (error) {
      console.error("광고 로그 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [pagination.page, pagination.limit, filters]);

  const getActionBadge = (action: string) => {
    const actionMap = {
      activate: { label: "활성화", variant: "default" as const },
      deactivate: { label: "비활성화", variant: "destructive" as const },
      extend: { label: "연장", variant: "secondary" as const },
      modify: { label: "수정", variant: "outline" as const },
    };
    return (
      actionMap[action as keyof typeof actionMap] || {
        label: action,
        variant: "outline" as const,
      }
    );
  };

  const exportLogs = () => {
    // CSV 내보내기 기능 (향후 구현)
    alert("CSV 내보내기 기능은 향후 구현될 예정입니다.");
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/advertisement-logs" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">광고 로그</h1>
          <p className="text-gray-600 mt-2">
            모든 광고 설정/해제 작업의 로그를 확인할 수 있습니다.
          </p>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="업체명 검색..."
                  value={filters.vendor_name}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      vendor_name: e.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="액션 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="activate">활성화</SelectItem>
                  <SelectItem value="deactivate">비활성화</SelectItem>
                  <SelectItem value="extend">연장</SelectItem>
                  <SelectItem value="modify">수정</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="시작 날짜"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-[160px]"
              />

              <Input
                type="date"
                placeholder="종료 날짜"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
                className="w-[160px]"
              />

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      vendor_name: "",
                      action: "all",
                      start_date: "",
                      end_date: "",
                    })
                  }
                  className="gap-2"
                >
                  <Filter size={16} />
                  필터 초기화
                </Button>
                <Button
                  variant="outline"
                  onClick={exportLogs}
                  className="gap-2"
                >
                  <Download size={16} />
                  CSV 내보내기
                </Button>
                <Button variant="outline" onClick={loadLogs} className="gap-2">
                  <RefreshCw size={16} />
                  새로고침
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 광고 로그 목록 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>광고 로그 ({pagination.total}개)</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages} 페이지
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page <= 1}
                  >
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
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </div>
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
                      <TableHead>업체명</TableHead>
                      <TableHead>액션</TableHead>
                      <TableHead>이전 만료일</TableHead>
                      <TableHead>새 만료일</TableHead>
                      <TableHead>이전 등급</TableHead>
                      <TableHead>새 등급</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>사유</TableHead>
                      <TableHead>생성자</TableHead>
                      <TableHead>생성일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const actionBadge = getActionBadge(log.action);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="font-medium">
                              {log.vendors?.name || "알 수 없음"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={actionBadge.variant}>
                              {actionBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.previous_expires_at
                              ? new Date(
                                  log.previous_expires_at
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {log.new_expires_at
                              ? new Date(
                                  log.new_expires_at
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>{log.previous_tier || "-"}</TableCell>
                          <TableCell>{log.new_tier || "-"}</TableCell>
                          <TableCell>
                            {log.duration_days ? `${log.duration_days}일` : "-"}
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-xs truncate"
                              title={log.reason || ""}
                            >
                              {log.reason || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {log.created_by}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar size={12} />
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
