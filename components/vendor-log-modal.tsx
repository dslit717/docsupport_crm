"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, RefreshCw, X } from "lucide-react";

interface VendorLog {
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
}

interface VendorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
}

export default function VendorLogModal({
  isOpen,
  onClose,
  vendorId,
  vendorName,
}: VendorLogModalProps) {
  const [logs, setLogs] = useState<VendorLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVendorLogs = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/manager-api/advertisement-logs?vendor_id=${vendorId}&limit=50`
      );
      const result = await response.json();

      if (response.ok) {
        setLogs(result.data || []);
      } else {
        console.error("업체 로그 로드 오류:", result.error);
      }
    } catch (error) {
      console.error("업체 로그 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vendorId) {
      loadVendorLogs();
    }
  }, [isOpen, vendorId]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{vendorName} - 광고 로그</span>
            <div className="flex items-center gap-2 pr-5">
              <Button
                variant="outline"
                size="sm"
                onClick={loadVendorLogs}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                새로고침
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            해당 업체의 모든 광고 설정/해제 작업 로그를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">광고 로그가 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>액션</TableHead>
                  <TableHead>이전 만료일</TableHead>
                  <TableHead>새 만료일</TableHead>
                  <TableHead>이전 등급</TableHead>
                  <TableHead>새 등급</TableHead>
                  <TableHead>이전 우선순위</TableHead>
                  <TableHead>새 우선순위</TableHead>
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
                        <Badge variant={actionBadge.variant}>
                          {actionBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(log.previous_expires_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(log.new_expires_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.previous_tier || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.new_tier || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.previous_priority_score !== null
                            ? log.previous_priority_score
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.new_priority_score !== null
                            ? log.new_priority_score
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.duration_days ? `${log.duration_days}일` : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate text-sm"
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
                          {formatDate(log.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

