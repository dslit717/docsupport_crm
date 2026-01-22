"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

interface ContactFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  productFilter: string;
  setProductFilter: (value: string) => void;
  products: Array<{ id: string; name: string }>;
  pagination: {
    page: number;
    limit: number;
  };
  setPagination: (value: any) => void;
  openCreateDialog: () => void;
}

export default function ContactFilterBar({
  searchQuery,
  setSearchQuery,
  productFilter,
  setProductFilter,
  products,
  pagination,
  setPagination,
  openCreateDialog,
}: ContactFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="제품명, 회사명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="제품 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 제품</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) =>
                setPagination((prev: any) => ({ ...prev, limit: parseInt(value), page: 1 }))
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="20">20개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={openCreateDialog} className="gap-2">
            <Plus size={16} />
            새 연락처 추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

