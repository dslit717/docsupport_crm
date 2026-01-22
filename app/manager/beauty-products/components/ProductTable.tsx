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
import { Edit, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { getProductImageUrl } from "@/lib/utils/image";

interface Product {
  id: string;
  name: string;
  name_en?: string;
  brand: string;
  category_ids?: string[];
  description?: string;
  links?: Array<{ name: string; url: string; type: string }>;
  image_name?: string; // ProductDetailImage 필드
  is_active?: boolean;
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

export default function ProductTable({
  products,
  loading,
  totalCount,
  currentPage,
  totalPages,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onPageChange,
  onToggleActive,
}: ProductTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>제품 목록 ({totalCount}개)</CardTitle>
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
                  <TableHead>이미지</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      제품명
                      {sortField === "name" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort("brand")}
                  >
                    <div className="flex items-center gap-1">
                      브랜드
                      {sortField === "brand" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>링크</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_name ? (
                          <img
                            src={getProductImageUrl(product.image_name) || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.name_en && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {product.name_en}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>
                        {product.categories && product.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.categories.map((cat) => (
                              <Badge
                                key={cat.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            onToggleActive(
                              product.id,
                              product.is_active ?? true
                            )
                          }
                          className="cursor-pointer"
                          title={
                            product.is_active
                              ? "클릭하여 비활성화"
                              : "클릭하여 활성화"
                          }
                        >
                          <Badge
                            variant={
                              product.is_active ? "default" : "secondary"
                            }
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {product.is_active ? "활성" : "비활성"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        {product.links && product.links.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {product.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                <ExternalLink size={10} />
                                {link.name || link.type || "링크"}
                              </a>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(product)}
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
                                <AlertDialogTitle>제품 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{product.name}" 제품을 삭제하시겠습니까? 이
                                  작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(product.id)}
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
