"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";

interface LoginLog {
  id: string;
  user_id: string;
  email: string;
  login_method: string;
  ip_address: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  success: boolean;
  created_at: string;
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<LoginLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    // 검색 필터링
    if (!search) {
      setFilteredLogs(logs);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.email.toLowerCase().includes(searchLower) ||
            log.ip_address.includes(searchLower) ||
            log.city.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/manager-api/login-logs?page=1&limit=100`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error("로그 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      oauth_kakao: "bg-yellow-100 text-yellow-800",
      oauth_google: "bg-blue-100 text-blue-800",
      oauth_naver: "bg-green-100 text-green-800",
      password: "bg-gray-100 text-gray-800",
    };
    const names: Record<string, string> = {
      oauth_kakao: "카카오",
      oauth_google: "구글",
      oauth_naver: "네이버",
      password: "비밀번호",
    };
    return (
      <Badge className={colors[method] || "bg-gray-100 text-gray-800"}>
        {names[method] || method}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === "mobile") return "📱";
    if (deviceType === "tablet") return "📱";
    return "💻";
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/login-logs" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            로그인 접속 로그
          </h1>
          <p className="text-gray-500 text-sm">
            일반 사용자(클라이언트)의 로그인 기록 및 접속 정보
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>로그인 기록</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 검색 */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="이메일, IP, 지역 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-gray-500">
                총 <span className="font-semibold text-gray-900">{filteredLogs.length}</span>개
              </div>
            </div>

            {/* 테이블 */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">로딩 중...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                로그인 기록이 없습니다
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시간</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>로그인 방법</TableHead>
                      <TableHead>디바이스</TableHead>
                      <TableHead>위치</TableHead>
                      <TableHead>IP 주소</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">{log.email}</TableCell>
                        <TableCell>{getMethodBadge(log.login_method)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            {getDeviceIcon(log.device_type)}
                            <span className="text-gray-600">
                              {log.browser} / {log.os}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {log.city}, {log.country}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-500">
                          {log.ip_address}
                        </TableCell>
                      </TableRow>
                    ))}
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
