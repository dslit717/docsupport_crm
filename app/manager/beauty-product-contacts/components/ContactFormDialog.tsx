"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  formData: {
    productId: string;
    companyNameKo: string;
    companyNameEn: string;
    contactNumber: string;
    companyHomepage: string;
    personInCharge: string;
  };
  products: Array<{ id: string; name: string; brand: string }>;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: string, value: string) => void;
}

export default function ContactFormDialog({
  isOpen,
  mode,
  formData,
  products,
  onClose,
  onSubmit,
  onChange,
}: ContactFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "새 연락처 추가" : "연락처 수정"}
          </DialogTitle>
          <DialogDescription>
            제품의 연락처 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제품 선택 (생성 시에만) */}
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="productId">
                제품 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => onChange("productId", value)}
              >
                <SelectTrigger id="productId">
                  <SelectValue placeholder="제품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.brand})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 회사명 (한글) */}
          <div className="space-y-2">
            <Label htmlFor="companyNameKo">
              회사명 (한글) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyNameKo"
              value={formData.companyNameKo}
              onChange={(e) => onChange("companyNameKo", e.target.value)}
              placeholder="예: 클라라솔루션"
            />
          </div>

          {/* 회사명 (영문) */}
          <div className="space-y-2">
            <Label htmlFor="companyNameEn">회사명 (영문)</Label>
            <Input
              id="companyNameEn"
              value={formData.companyNameEn}
              onChange={(e) => onChange("companyNameEn", e.target.value)}
              placeholder="예: Clara Solution"
            />
          </div>

          {/* 연락처 */}
          <div className="space-y-2">
            <Label htmlFor="contactNumber">연락처</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) => onChange("contactNumber", e.target.value)}
              placeholder="예: 02-1234-5678"
            />
          </div>

          {/* 담당자 */}
          <div className="space-y-2">
            <Label htmlFor="personInCharge">담당자</Label>
            <Input
              id="personInCharge"
              value={formData.personInCharge}
              onChange={(e) => onChange("personInCharge", e.target.value)}
              placeholder="예: 홍길동"
            />
          </div>

          {/* 홈페이지 */}
          <div className="space-y-2">
            <Label htmlFor="companyHomepage">회사 홈페이지</Label>
            <Input
              id="companyHomepage"
              type="url"
              value={formData.companyHomepage}
              onChange={(e) => onChange("companyHomepage", e.target.value)}
              placeholder="예: https://www.example.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              (mode === "create" && !formData.productId) ||
              !formData.companyNameKo
            }
          >
            {mode === "create" ? "추가" : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

