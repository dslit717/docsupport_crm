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
import { Edit, Trash2, Phone, Globe, User, ChevronUp, ChevronDown } from "lucide-react";

interface Contact {
  id: string;
  product_id: string;
  contact_id: string;
  product: {
    id: string;
    name: string;
    name_en?: string;
    brand: string;
    image_url?: string;
  };
  contact: {
    id: string;
    company_name_ko: string;
    company_name_en?: string;
    contact_number?: string;
    company_homepage?: string;
    person_in_charge?: string;
  };
  created_at: string;
}

interface ContactTableProps {
  contacts: Contact[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export default function ContactTable({
  contacts,
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
}: ContactTableProps) {
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>연락처 목록</CardTitle>
          <Badge variant="secondary">총 {totalCount}개</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSort("product_name")}
                >
                  제품명 <SortIcon field="product_name" />
                </TableHead>
                <TableHead>제조사</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSort("company_name")}
                >
                  회사명 <SortIcon field="company_name" />
                </TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead>홈페이지</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSort("created_at")}
                >
                  등록일 <SortIcon field="created_at" />
                </TableHead>
                <TableHead className="text-right w-[120px]">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    등록된 연락처가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contact.product.name}</div>
                        {contact.product.name_en && (
                          <div className="text-xs text-gray-500">
                            {contact.product.name_en}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contact.product.brand}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {contact.contact.company_name_ko}
                        </div>
                        {contact.contact.company_name_en && (
                          <div className="text-xs text-gray-500">
                            {contact.contact.company_name_en}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.contact.contact_number ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {contact.contact.contact_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.contact.person_in_charge ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {contact.contact.person_in_charge}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.contact.company_homepage ? (
                        <a
                          href={contact.contact.company_homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          <span className="text-sm">바로가기</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(contact.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>연락처 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                정말로 이 연락처를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(contact.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  );
                })
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <div key={`ellipsis-${page}`}>
                        <span className="px-2">...</span>
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

