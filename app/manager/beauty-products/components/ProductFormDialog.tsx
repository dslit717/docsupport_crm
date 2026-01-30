"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ExternalLink } from "lucide-react";

interface ProductFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  formData: {
    name: string;
    nameEn: string;
    brand: string;
    categoryIds: string[];
    description: string;
    links: Array<{ name: string; url: string; type: string }>;
    contacts: Array<{
      id?: string;
      company_name_ko: string;
      company_name_en?: string;
      contact_number?: string;
      company_homepage?: string;
      person_in_charge?: string;
    }>;
    isActive: boolean;
  };
  categories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: string, value: any) => void;
}

export default function ProductFormDialog({
  isOpen,
  mode,
  formData,
  categories,
  onClose,
  onSubmit,
  onChange,
}: ProductFormDialogProps) {
  const handleAddCategory = (categoryId: string) => {
    if (categoryId && !formData.categoryIds.includes(categoryId)) {
      onChange("categoryIds", [...formData.categoryIds, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    onChange(
      "categoryIds",
      formData.categoryIds.filter((id) => id !== categoryId)
    );
  };

  const availableCategories = categories.filter(
    (cat) => !formData.categoryIds.includes(cat.id)
  );

  const handleAddLink = () => {
    onChange("links", [
      ...formData.links,
      { name: "", url: "", type: "official" },
    ]);
  };

  const handleRemoveLink = (index: number) => {
    onChange(
      "links",
      formData.links.filter((_, i) => i !== index)
    );
  };

  const handleUpdateLink = (
    index: number,
    field: "name" | "url" | "type",
    value: string
  ) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    onChange("links", updatedLinks);
  };

  const handleAddContact = () => {
    onChange("contacts", [
      ...formData.contacts,
      {
        company_name_ko: "",
        company_name_en: "",
        contact_number: "",
        company_homepage: "",
        person_in_charge: "",
      },
    ]);
  };

  const handleRemoveContact = (index: number) => {
    onChange(
      "contacts",
      formData.contacts.filter((_, i) => i !== index)
    );
  };

  const handleUpdateContact = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    onChange("contacts", updatedContacts);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "새 제품 추가" : "제품 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">제품명 (한글) *</label>
              <Input
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="제품명을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm font-medium">제품명 (영문)</label>
              <Input
                value={formData.nameEn}
                onChange={(e) => onChange("nameEn", e.target.value)}
                placeholder="영문 제품명을 입력하세요"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">브랜드 *</label>
            <Input
              value={formData.brand}
              onChange={(e) => onChange("brand", e.target.value)}
              placeholder="브랜드/제조사를 입력하세요"
            />
          </div>

          <div>
            <label className="text-sm font-medium">카테고리</label>

            {/* 선택된 카테고리 표시 */}
            {formData.categoryIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md bg-gray-50">
                {formData.categoryIds.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  return category ? (
                    <Badge
                      key={categoryId}
                      variant="default"
                      className="gap-1 pr-1"
                    >
                      {category.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(categoryId)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* 카테고리 추가 선택 */}
            <Select
              value=""
              onValueChange={handleAddCategory}
              disabled={availableCategories.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    availableCategories.length === 0
                      ? "모든 카테고리가 선택되었습니다"
                      : "카테고리 추가..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              여러 카테고리를 선택할 수 있습니다. X 버튼으로 제거할 수 있습니다.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">설명</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="제품 설명을 입력하세요"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">판매/문의처</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                className="gap-1"
              >
                <Plus size={14} />
                연락처 추가
              </Button>
            </div>

            {formData.contacts.length > 0 ? (
              <div className="space-y-3">
                {formData.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-md bg-gray-50 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-600">
                        연락처 #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          회사명 (한글) *
                        </label>
                        <Input
                          value={contact.company_name_ko}
                          onChange={(e) =>
                            handleUpdateContact(
                              index,
                              "company_name_ko",
                              e.target.value
                            )
                          }
                          placeholder="회사명을 입력하세요"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          회사명 (영문)
                        </label>
                        <Input
                          value={contact.company_name_en || ""}
                          onChange={(e) =>
                            handleUpdateContact(
                              index,
                              "company_name_en",
                              e.target.value
                            )
                          }
                          placeholder="Company Name"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          연락처
                        </label>
                        <Input
                          value={contact.contact_number || ""}
                          onChange={(e) =>
                            handleUpdateContact(
                              index,
                              "contact_number",
                              e.target.value
                            )
                          }
                          placeholder="전화번호 또는 이메일"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          담당자
                        </label>
                        <Input
                          value={contact.person_in_charge || ""}
                          onChange={(e) =>
                            handleUpdateContact(
                              index,
                              "person_in_charge",
                              e.target.value
                            )
                          }
                          placeholder="담당자 이름"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">
                        회사 홈페이지
                      </label>
                      <Input
                        value={contact.company_homepage || ""}
                        onChange={(e) =>
                          handleUpdateContact(
                            index,
                            "company_homepage",
                            e.target.value
                          )
                        }
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed rounded-md text-gray-400">
                연락처가 없습니다. "연락처 추가" 버튼을 클릭하세요.
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">제품 링크</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLink}
                className="gap-1"
              >
                <Plus size={14} />
                링크 추가
              </Button>
            </div>

            {formData.links.length > 0 ? (
              <div className="space-y-3">
                {formData.links.map((link, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-md bg-gray-50 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-600">
                        링크 #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          링크 이름
                        </label>
                        <Input
                          value={link.name}
                          onChange={(e) =>
                            handleUpdateLink(index, "name", e.target.value)
                          }
                          placeholder="예: 구매 링크"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">
                          링크 타입
                        </label>
                        <Select
                          value={link.type}
                          onValueChange={(value) =>
                            handleUpdateLink(index, "type", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="official">
                              공식 사이트
                            </SelectItem>
                            <SelectItem value="purchase">구매 링크</SelectItem>
                            <SelectItem value="review">리뷰</SelectItem>
                            <SelectItem value="video">영상</SelectItem>
                            <SelectItem value="other">기타</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">URL</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            handleUpdateLink(index, "url", e.target.value)
                          }
                          placeholder="https://..."
                          className="flex-1"
                        />
                        {link.url && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 border rounded-md hover:bg-gray-100"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed rounded-md text-gray-400">
                링크가 없습니다. "링크 추가" 버튼을 클릭하세요.
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              📷 제품 이미지는{" "}
              <a
                href="/manager/beauty-products/images"
                className="underline font-medium hover:text-blue-900"
              >
                이미지 관리 페이지
              </a>
              에서 업로드할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              제품 활성화 (활성화된 제품만 사용자에게 표시됩니다)
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onSubmit}>
            {mode === "create" ? "생성" : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
