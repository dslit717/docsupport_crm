"use client";

import React from "react";
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
import { Phone, User, ChevronUp, ChevronDown, Copy, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  name_en?: string;
  brand: string;
  image_url?: string;
  is_active: boolean;
}

interface ContactWithProducts {
  id: string;
  company_name_ko: string;
  company_name_en?: string;
  contact_number?: string;
  company_homepage?: string;
  person_in_charge?: string;
  products: Product[];
  product_count: number;
}

interface ContactsTableProps {
  contacts: ContactWithProducts[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
}

export default function ContactsTable({
  contacts,
  loading,
  totalCount,
  currentPage,
  totalPages,
  sortField,
  sortDirection,
  onSort,
  onPageChange,
}: ContactsTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyProductList = (contact: ContactWithProducts) => {
    const productListText = contact.products
      .map((product) => product.name)
      .join(', ');
    
    navigator.clipboard.writeText(productListText).then(() => {
      setCopiedId(contact.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
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
          <CardTitle>연락처별 제품 목록</CardTitle>
          <Badge variant="secondary">총 {totalCount}개 연락처</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSort("company_name_ko")}
                >
                  회사명 <SortIcon field="company_name_ko" />
                </TableHead>
                <TableHead className="w-[150px]">연락처</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSort("person_in_charge")}
                >
                  담당자 <SortIcon field="person_in_charge" />
                </TableHead>
                <TableHead className="text-center">제품 수</TableHead>
                <TableHead>담당 제품 목록</TableHead>
                <TableHead className="text-center w-[100px]">복사</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    등록된 연락처가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contact.company_name_ko}</div>
                        {contact.company_name_en && (
                          <div className="text-xs text-gray-500">
                            {contact.company_name_en}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.contact_number ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{contact.contact_number}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.person_in_charge ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{contact.person_in_charge}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{contact.product_count}개</Badge>
                    </TableCell>
                    <TableCell>
                      {contact.products.length === 0 ? (
                        <span className="text-gray-400">담당 제품 없음</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {contact.products.map((product) => (
                            <div
                              key={product.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-gray-50"
                            >
                              <span className="text-sm font-medium">
                                {product.name}
                              </span>
                              {!product.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  비활성
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {contact.products.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyProductList(contact)}
                          className="w-full"
                        >
                          {copiedId === contact.id ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              복사
                            </>
                          )}
                        </Button>
                      )}
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

