"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, Trash2, Star, Phone, MapPin, History, ImageIcon, MessageSquare } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  status: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  advertisement_tier: string;
  advertisement_expires_at?: string;
  priority_score: number;
  description_md?: string;
  categories?: Array<{ id: string; name: string }>;
  search_embedding?: string | null;
  created_at: string;
  updated_at: string;
}

interface VendorTableProps {
  vendors: Vendor[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
  onAdvertisement: (vendor: Vendor) => void;
  onGenerateEmbedding: (vendor: Vendor) => void;
  onViewLog: (vendor: Vendor) => void;
  onManageImages?: (vendor: Vendor) => void;
  onSendSms?: (vendor: Vendor) => void;
  onPageChange: (page: number) => void;
}

export default function VendorTable({
  vendors,
  loading,
  totalCount,
  currentPage,
  totalPages,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onAdvertisement,
  onGenerateEmbedding,
  onViewLog,
  onManageImages,
  onSendSms,
  onPageChange,
}: VendorTableProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "초안", variant: "secondary" as const },
      published: { label: "게시", variant: "default" as const },
      archived: { label: "보관", variant: "outline" as const },
    };
    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: "secondary" as const,
      }
    );
  };

  const getAdvertisementBadge = (vendor: Vendor) => {
    const now = new Date();
    const expiresAt = vendor.advertisement_expires_at
      ? new Date(vendor.advertisement_expires_at)
      : null;

    if (!expiresAt || expiresAt <= now) {
      return { label: "일반", variant: "outline" as const };
    }

    const tierMap = {
      basic: { label: "기본 광고", variant: "default" as const },
      premium: { label: "프리미엄", variant: "secondary" as const },
      featured: { label: "추천", variant: "destructive" as const },
    };
    return (
      tierMap[vendor.advertisement_tier as keyof typeof tierMap] || {
        label: "광고",
        variant: "default" as const,
      }
    );
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-gray-900">업체 목록 ({totalCount}개)</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages} 페이지
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
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
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      업체명
                      {sortField === "name" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      연락처/위치/상태
                      {sortField === "status" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("advertisement_tier")}
                  >
                    <div className="flex items-center gap-1">
                      광고
                      {sortField === "advertisement_tier" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("advertisement_expires_at")}
                  >
                    <div className="flex items-center gap-1">
                      광고 만료일
                      {sortField === "advertisement_expires_at" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("priority_score")}
                  >
                    <div className="flex items-center gap-1">
                      우선순위
                      {sortField === "priority_score" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>AI검색</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>업체 설명</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => {
                  const statusBadge = getStatusBadge(vendor.status);
                  const adBadge = getAdvertisementBadge(vendor);

                  return (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{vendor.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone size={10} className="flex-shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {vendor.phone || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin size={10} className="flex-shrink-0" />
                            <span className="truncate max-w-[120px]" title={vendor.address}>
                              {vendor.address || "-"}
                            </span>
                          </div>
                          <div className="pt-0.5">
                            <Badge variant={statusBadge.variant} className="text-xs px-1.5 py-0">
                              {statusBadge.label}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={adBadge.variant}>{adBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {vendor.advertisement_expires_at ? (
                          <span
                            className={`text-sm ${
                              new Date(vendor.advertisement_expires_at) <
                              new Date()
                                ? "text-red-600 font-medium"
                                : new Date(vendor.advertisement_expires_at) <
                                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? "text-orange-600"
                                : "text-gray-600"
                            }`}
                          >
                            {new Date(
                              vendor.advertisement_expires_at
                            ).toLocaleDateString()}
                            {new Date(vendor.advertisement_expires_at) <
                              new Date() && " (만료)"}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500" />
                          {vendor.priority_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vendor.search_embedding ? (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-600"
                          >
                            ✓ 완료
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-gray-500"
                          >
                            미등록
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vendor.categories && vendor.categories.length > 0 ? (
                            vendor.categories.map((category) => (
                              <Badge
                                key={category.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {category.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">
                              미지정
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {vendor.description_md ? (
                            <div
                              className="text-sm text-gray-700 truncate"
                              title={vendor.description_md}
                            >
                              {vendor.description_md}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              설명 없음
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(vendor)}
                          >
                            <Edit size={12} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAdvertisement(vendor)}
                          >
                            광고
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onGenerateEmbedding(vendor)}
                            disabled={!vendor.description_md}
                            title={
                              !vendor.description_md
                                ? "업체 설명이 필요합니다"
                                : "AI 검색용 벡터 생성"
                            }
                          >
                            벡터화
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewLog(vendor)}
                            className="gap-1"
                            title="변경 이력"
                          >
                            <History size={12} />
                          </Button>

                          {onManageImages && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onManageImages(vendor)}
                              className="gap-1"
                              title="이미지 관리"
                            >
                              <ImageIcon size={12} />
                            </Button>
                          )}

                          {onSendSms && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSendSms(vendor)}
                              className="gap-1"
                              title="파트너 문자 보내기"
                            >
                              <MessageSquare size={12} />
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 size={12} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>업체 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{vendor.name}" 업체를 삭제하시겠습니까? 이
                                  작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(vendor.id)}
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
  );
}

