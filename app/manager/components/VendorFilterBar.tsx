"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";

interface VendorFilterBarProps {
  searchQuery: string;
  statusFilter: string;
  advertisementFilter: string;
  categoryFilter: string;
  limit: number;
  categories: any[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onAdvertisementChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLimitChange: (value: number) => void;
  onCreateClick: () => void;
}

export default function VendorFilterBar({
  searchQuery,
  statusFilter,
  advertisementFilter,
  categoryFilter,
  limit,
  categories,
  onSearchChange,
  onStatusChange,
  onAdvertisementChange,
  onCategoryChange,
  onLimitChange,
  onCreateClick,
}: VendorFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="업체명, 전화번호 검색..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="published">게시</SelectItem>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="archived">보관</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={advertisementFilter}
              onValueChange={onAdvertisementChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="광고 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="true">광고 중</SelectItem>
                <SelectItem value="false">일반</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories
                  .filter((category) => category.id && category.id.trim() !== "")
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
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

          <Button onClick={onCreateClick} className="gap-2">
            <Plus size={16} />새 업체 추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
