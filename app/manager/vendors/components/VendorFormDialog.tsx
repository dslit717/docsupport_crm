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
  DialogDescription,
} from "@/components/ui/dialog";

interface VendorFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  formData: {
    name: string;
    phone: string;
    mobile: string;
    description: string;
    email: string;
    website: string;
    address: string;
    service_areas: string;
    kakao_channel: string;
    consultation_url: string;
    priorityScore: number;
    status: string;
    categoryIds?: string[];
  };
  categories?: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: string, value: any) => void;
}

export default function VendorFormDialog({
  isOpen,
  mode,
  formData,
  categories = [],
  onClose,
  onSubmit,
  onChange,
}: VendorFormDialogProps) {
  const toggleCategory = (categoryId: string) => {
    const current = formData.categoryIds || [];
    if (current.includes(categoryId)) {
      onChange(
        "categoryIds",
        current.filter((id) => id !== categoryId)
      );
    } else {
      onChange("categoryIds", [...current, categoryId]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-hidden flex flex-col w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "새 업체 추가" : "업체 수정"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">업체명 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="업체명을 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm font-medium">상태</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => onChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">초안</SelectItem>
                    <SelectItem value="published">게시</SelectItem>
                    <SelectItem value="archived">보관</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">전화번호</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  placeholder="대표 전화번호"
                />
              </div>
              <div>
                <label className="text-sm font-medium">휴대전화</label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => onChange("mobile", e.target.value)}
                  placeholder="휴대전화 번호"
                />
              </div>
              <div>
                <label className="text-sm font-medium">이메일</label>
                <Input
                  value={formData.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">웹사이트</label>
                <Input
                  value={formData.website}
                  onChange={(e) => onChange("website", e.target.value)}
                  placeholder="웹사이트 URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium">우선순위</label>
                <Input
                  type="number"
                  value={formData.priorityScore}
                  onChange={(e) =>
                    onChange("priorityScore", parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">주소</label>
                <Input
                  value={formData.address}
                  onChange={(e) => onChange("address", e.target.value)}
                  placeholder="전체 주소를 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm font-medium">서비스 지역</label>
                <Input
                  value={formData.service_areas}
                  onChange={(e) => onChange("service_areas", e.target.value)}
                  placeholder="서비스 지역 (예: 서울, 경기)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">카카오 채널</label>
                <Input
                  value={formData.kakao_channel}
                  onChange={(e) => onChange("kakao_channel", e.target.value)}
                  placeholder="카카오톡 채널 URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium">상담 URL</label>
                <Input
                  value={formData.consultation_url}
                  onChange={(e) => onChange("consultation_url", e.target.value)}
                  placeholder="상담 페이지 URL"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">업체 설명</label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                value={formData.description}
                onChange={(e) => onChange("description", e.target.value)}
                placeholder="업체에 대한 상세한 설명을 입력하세요. 이 내용은 AI 검색에 활용됩니다."
              />
              <p className="text-xs text-gray-500 mt-1">
                상세한 설명을 입력하면 AI 검색 시 더 정확한 결과를 제공할 수 있습니다.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                카테고리 선택
              </label>
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-3 gap-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-3">
                      등록된 카테고리가 없습니다.
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded"
                      >
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={(formData.categoryIds || []).includes(
                            category.id
                          )}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                선택한 카테고리: {(formData.categoryIds || []).length}개
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
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

// Advertisement Dialog Component
interface AdvertisementDialogProps {
  isOpen: boolean;
  vendorName?: string;
  advertisementData: {
    is_advertisement: boolean;
    advertisement_tier: string;
    advertisement_duration_days: number;
    priority_score: number;
  };
  onClose: () => void;
  onSubmit: () => void;
  onChange: (data: any) => void;
}

export function AdvertisementDialog({
  isOpen,
  vendorName,
  advertisementData,
  onClose,
  onSubmit,
  onChange,
}: AdvertisementDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>광고 설정</DialogTitle>
          <DialogDescription>
            {vendorName} 업체의 광고 설정을 관리합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_advertisement"
              checked={advertisementData.is_advertisement}
              onChange={(e) =>
                onChange({
                  ...advertisementData,
                  is_advertisement: e.target.checked,
                })
              }
              className="rounded"
            />
            <label htmlFor="is_advertisement" className="text-sm font-medium">
              광고 활성화
            </label>
          </div>

          {advertisementData.is_advertisement && (
            <>
              <div>
                <label className="text-sm font-medium">광고 등급</label>
                <Select
                  value={advertisementData.advertisement_tier}
                  onValueChange={(value) =>
                    onChange({
                      ...advertisementData,
                      advertisement_tier: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">기본</SelectItem>
                    <SelectItem value="premium">프리미엄</SelectItem>
                    <SelectItem value="featured">특별</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">광고 기간 (일)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={advertisementData.advertisement_duration_days}
                  onChange={(e) =>
                    onChange({
                      ...advertisementData,
                      advertisement_duration_days:
                        parseInt(e.target.value) || 30,
                    })
                  }
                  placeholder="광고 기간을 입력하세요"
                />
                <p className="text-xs text-gray-500 mt-1">
                  설정한 기간이 지나면 자동으로 광고가 비활성화됩니다.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">우선순위 점수</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={advertisementData.priority_score}
                  onChange={(e) =>
                    onChange({
                      ...advertisementData,
                      priority_score: parseInt(e.target.value) || 90,
                    })
                  }
                  placeholder="우선순위 점수를 입력하세요"
                />
                <p className="text-xs text-gray-500 mt-1">
                  높을수록 검색 결과에서 우선 표시됩니다.
                </p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onSubmit}>
            {advertisementData.is_advertisement
              ? "광고 활성화"
              : "광고 비활성화"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


