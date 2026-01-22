"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import VendorFilterBar from "../components/VendorFilterBar";
import VendorTable from "./components/VendorTable";
import VendorFormDialog, {
  AdvertisementDialog,
} from "./components/VendorFormDialog";
import VendorLogModal from "@/components/vendor-log-modal";
import VendorImageManager from "./components/VendorImageManager";
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
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, RefreshCw } from "lucide-react";

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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advertisementFilter, setAdvertisementFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isAdvertisementDialogOpen, setIsAdvertisementDialogOpen] =
    useState(false);
  const [isVendorLogModalOpen, setIsVendorLogModalOpen] = useState(false);
  const [selectedVendorForLog, setSelectedVendorForLog] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [selectedVendorForImage, setSelectedVendorForImage] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // SMS 다이얼로그
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [selectedVendorForSms, setSelectedVendorForSms] = useState<Vendor | null>(null);
  const [smsPreview, setSmsPreview] = useState<{
    preview_message: string;
    phone: string | null;
    mobile: string | null;
  } | null>(null);
  const [smsToNumber, setSmsToNumber] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    mobile: "",
    description: "",
    email: "",
    website: "",
    address: "",
    service_areas: "",
    kakao_channel: "",
    consultation_url: "",
    priorityScore: 0,
    status: "published",
    categoryIds: [] as string[],
  });

  const [advertisementData, setAdvertisementData] = useState({
    is_advertisement: false,
    advertisement_tier: "basic",
    advertisement_duration_days: 30,
    priority_score: 90,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState("priority_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch("/manager-api/vendor-categories");
      const result = await response.json();
      if (response.ok) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error("카테고리 목록 로드 오류:", error);
    }
  };

  // Load vendors
  const loadVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(advertisementFilter &&
          advertisementFilter !== "all" && {
            is_advertisement: advertisementFilter,
          }),
        ...(categoryFilter &&
          categoryFilter !== "all" && { category_id: categoryFilter }),
      });

      const [countResponse, dataResponse] = await Promise.all([
        fetch(`/manager-api/vendors/count?${params}`),
        fetch(`/manager-api/vendors?${params}`),
      ]);

      const countResult = await countResponse.json();
      const dataResult = await dataResponse.json();

      if (countResponse.ok) {
        const count = countResult.count || 0;
        setTotalCount(count);
        setPagination((prev) => ({
          ...prev,
          total: count,
          totalPages: Math.ceil(count / prev.limit),
        }));
      }

      if (dataResponse.ok) {
        setVendors(dataResult.data || []);
      }
    } catch (error) {
      console.error("업체 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, statusFilter, advertisementFilter, categoryFilter]);

  useEffect(() => {
    loadVendors();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    statusFilter,
    advertisementFilter,
    categoryFilter,
    sortField,
    sortDirection,
  ]);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      mobile: "",
      description: "",
      email: "",
      website: "",
      address: "",
      service_areas: "",
      kakao_channel: "",
      consultation_url: "",
      priorityScore: 0,
      status: "published",
      categoryIds: [],
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = async (vendor: Vendor) => {
    setSelectedVendor(vendor);

    try {
      const response = await fetch(`/manager-api/vendors/${vendor.id}`);
      if (response.ok) {
        const result = await response.json();
        const fullVendor = result.data;
        
        const categoryIds = vendor.categories?.map((c) => c.id) || [];

        setFormData({
          name: fullVendor.name || "",
          phone: fullVendor.phone || "",
          mobile: fullVendor.mobile || "",
          description: fullVendor.description_md || "",
          email: fullVendor.email || "",
          website: fullVendor.website || "",
          address: fullVendor.address || "",
          service_areas: fullVendor.service_areas || "",
          kakao_channel: fullVendor.kakao_channel || "",
          consultation_url: fullVendor.consultation_url || "",
          priorityScore: fullVendor.priority_score || 0,
          status: fullVendor.status || "published",
          categoryIds,
        });
      }
    } catch (error) {
      console.error("업체 정보 로드 오류:", error);
      const categoryIds = vendor.categories?.map((c) => c.id) || [];
      setFormData({
        name: vendor.name,
        phone: vendor.phone || "",
        mobile: "",
        description: vendor.description_md || "",
        email: vendor.email || "",
        website: vendor.website || "",
        address: "",
        service_areas: "",
        kakao_channel: "",
        consultation_url: "",
        priorityScore: vendor.priority_score,
        status: vendor.status,
        categoryIds,
      });
    }
    
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const vendorData = {
      name: formData.name,
      description_md: formData.description,
      phone: formData.phone,
      mobile: formData.mobile,
      email: formData.email,
      website: formData.website,
      address: formData.address,
      service_areas: formData.service_areas,
      kakao_channel: formData.kakao_channel,
      consultation_url: formData.consultation_url,
      is_certified: false,
      priority_score: formData.priorityScore,
      advertisement_tier: dialogMode === "edit" ? undefined : "none",
      status: formData.status,
      category_ids: formData.categoryIds,
    };

    try {
      const url =
        dialogMode === "create"
          ? "/manager-api/vendors"
          : `/manager-api/vendors/${selectedVendor?.id}`;

      const response = await fetch(url, {
        method: dialogMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorData),
      });

      if (response.ok) {
        const result = await response.json();
        const vendorId =
          dialogMode === "create" ? result.data.id : selectedVendor?.id;

        if (formData.description && formData.description.trim()) {
          try {
            const categoryNames = categories
              .filter((cat) => formData.categoryIds.includes(cat.id))
              .map((cat) => cat.name)
              .join(", ");

            let embeddingText = `업체명: ${formData.name}\n`;
            embeddingText += `업체 설명: ${formData.description}\n`;
            if (categoryNames) {
              embeddingText += `카테고리: ${categoryNames}\n`;
            }
            if (formData.address) {
              embeddingText += `위치: ${formData.address}\n`;
            }

            await fetch(`/manager-api/vendors/${vendorId}/embedding`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description_md: embeddingText,
              }),
            });
          } catch (embeddingError) {
            console.error("자동 벡터화 오류:", embeddingError);
          }
        }

        setIsDialogOpen(false);
        setSelectedVendor(null);
        loadVendors();
        alert(
          dialogMode === "create"
            ? "업체가 생성되었습니다."
            : "업체가 수정되었습니다."
        );
      } else {
        const result = await response.json();
        alert(`오류: ${result.error || result.message}`);
      }
    } catch (error: any) {
      console.error("업체 저장 오류:", error);
      alert(`업체 저장 중 오류가 발생했습니다.\n\n${error?.message || error}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/vendors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadVendors();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("업체 삭제 오류:", error);
      alert("업체 삭제 중 오류가 발생했습니다.");
    }
  };

  const openAdvertisementDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor);

    const now = new Date();
    const expiresAt = vendor.advertisement_expires_at
      ? new Date(vendor.advertisement_expires_at)
      : null;
    const isActive = expiresAt && expiresAt > now;

    setAdvertisementData({
      is_advertisement: isActive || false,
      advertisement_tier: vendor.advertisement_tier || "basic",
      advertisement_duration_days: 30,
      priority_score: vendor.priority_score || 90,
    });
    setIsAdvertisementDialogOpen(true);
  };

  const handleSetAdvertisement = async () => {
    if (!selectedVendor) return;

    try {
      const response = await fetch(
        `/manager-api/vendors/${selectedVendor.id}/advertisement`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(advertisementData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadVendors();
        setIsAdvertisementDialogOpen(false);
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("광고 상태 설정 오류:", error);
      alert("광고 설정 중 오류가 발생했습니다.");
    }
  };

  const handleGenerateEmbedding = async (vendor: Vendor) => {
    if (!vendor.description_md) {
      alert("업체 설명이 없습니다. 먼저 설명을 입력해주세요.");
      return;
    }

    try {
      const categoryNames =
        vendor.categories?.map((cat) => cat.name).join(", ") || "";

      let embeddingText = `업체명: ${vendor.name}\n`;
      embeddingText += `업체 설명: ${vendor.description_md}\n`;
      if (categoryNames) {
        embeddingText += `카테고리: ${categoryNames}\n`;
      }
      if (vendor.address) {
        embeddingText += `위치: ${vendor.address}\n`;
      }

      const response = await fetch(
        `/manager-api/vendors/${vendor.id}/embedding`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description_md: embeddingText,
          }),
        }
      );

      if (response.ok) {
        alert("업체 설명이 벡터로 변환되어 AI 검색에 활용됩니다.");
        loadVendors();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("벡터화 오류:", error);
      alert("벡터화 처리 중 오류가 발생했습니다.");
    }
  };

  const openVendorLogModal = (vendor: Vendor) => {
    setSelectedVendorForLog({
      id: vendor.id,
      name: vendor.name,
    });
    setIsVendorLogModalOpen(true);
  };

  const openImageManager = (vendor: Vendor) => {
    setSelectedVendorForImage({
      id: vendor.id,
      name: vendor.name,
    });
    setIsImageManagerOpen(true);
  };

  const openSmsDialog = async (vendor: Vendor) => {
    setSelectedVendorForSms(vendor);
    setSmsLoading(true);
    setIsSmsDialogOpen(true);
    setSmsToNumber(vendor.phone || "");

    try {
      const response = await fetch(`/manager-api/vendors/send-sms?vendor_id=${vendor.id}`);
      const result = await response.json();
      
      if (response.ok) {
        setSmsPreview({
          preview_message: result.data.preview_message,
          phone: result.data.phone,
          mobile: result.data.mobile,
        });
        setSmsToNumber(result.data.mobile || result.data.phone || "");
      } else {
        alert(`미리보기 로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("SMS 미리보기 로드 오류:", error);
      alert("SMS 미리보기를 로드하는 중 오류가 발생했습니다.");
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSendSms = async () => {
    if (!selectedVendorForSms || !smsToNumber) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    setSmsSending(true);
    try {
      const response = await fetch("/manager-api/vendors/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: selectedVendorForSms.id,
          to_number: smsToNumber,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        alert(`${selectedVendorForSms.name}님께 파트너 문자가 전송되었습니다.`);
        setIsSmsDialogOpen(false);
        setSelectedVendorForSms(null);
        setSmsPreview(null);
        setSmsToNumber("");
      } else {
        alert(`전송 실패: ${result.error || result.message}`);
      }
    } catch (error: any) {
      console.error("SMS 전송 오류:", error);
      alert(`SMS 전송 중 오류가 발생했습니다.\n\n${error?.message || error}`);
    } finally {
      setSmsSending(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentPath="/manager/vendors" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">업체 관리</h1>
          <p className="text-gray-600 mt-2">
            업체 정보를 관리하고 광고 상태를 설정할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <VendorFilterBar
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            advertisementFilter={advertisementFilter}
            categoryFilter={categoryFilter}
            limit={pagination.limit}
            categories={categories}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onAdvertisementChange={setAdvertisementFilter}
            onCategoryChange={setCategoryFilter}
            onLimitChange={(value) =>
              setPagination((prev) => ({ ...prev, limit: value, page: 1 }))
            }
            onCreateClick={openCreateDialog}
          />

          <VendorTable
            vendors={vendors}
            loading={loading}
            totalCount={totalCount}
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onAdvertisement={openAdvertisementDialog}
            onGenerateEmbedding={handleGenerateEmbedding}
            onViewLog={openVendorLogModal}
            onManageImages={openImageManager}
            onSendSms={openSmsDialog}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
          />

          <VendorFormDialog
            isOpen={isDialogOpen}
            mode={dialogMode}
            formData={formData}
            categories={categories}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedVendor(null);
            }}
            onSubmit={handleSubmit}
            onChange={handleFormChange}
          />

          <AdvertisementDialog
            isOpen={isAdvertisementDialogOpen}
            vendorName={selectedVendor?.name}
            advertisementData={advertisementData}
            onClose={() => {
              setIsAdvertisementDialogOpen(false);
              setSelectedVendor(null);
            }}
            onSubmit={handleSetAdvertisement}
            onChange={setAdvertisementData}
          />

          {selectedVendorForLog && (
            <VendorLogModal
              isOpen={isVendorLogModalOpen}
              onClose={() => {
                setIsVendorLogModalOpen(false);
                setSelectedVendorForLog(null);
              }}
              vendorId={selectedVendorForLog.id}
              vendorName={selectedVendorForLog.name}
            />
          )}

          {selectedVendorForImage && (
            <VendorImageManager
              isOpen={isImageManagerOpen}
              onClose={() => {
                setIsImageManagerOpen(false);
                setSelectedVendorForImage(null);
              }}
              vendorId={selectedVendorForImage.id}
              vendorName={selectedVendorForImage.name}
            />
          )}

          {/* SMS 다이얼로그 */}
          <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  파트너 문자 보내기
                </DialogTitle>
                <DialogDescription>
                  {selectedVendorForSms?.name}에게 파트너 안내 문자를 전송합니다.
                </DialogDescription>
              </DialogHeader>

              {smsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smsToNumber">수신번호</Label>
                    <div className="flex gap-2">
                      <Input
                        id="smsToNumber"
                        value={smsToNumber}
                        onChange={(e) => setSmsToNumber(e.target.value)}
                        placeholder="01012345678"
                        className="flex-1"
                      />
                      {smsPreview?.phone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSmsToNumber(smsPreview.phone || "")}
                        >
                          전화 ({smsPreview.phone})
                        </Button>
                      )}
                      {smsPreview?.mobile && smsPreview.mobile !== smsPreview.phone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSmsToNumber(smsPreview.mobile || "")}
                        >
                          휴대폰 ({smsPreview.mobile})
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>메시지 내용 (미리보기)</Label>
                    <Textarea
                      value={smsPreview?.preview_message || ""}
                      readOnly
                      className="min-h-[300px] text-sm bg-gray-50 font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      * 메시지는 LMS (장문 문자)로 전송됩니다.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSmsDialogOpen(false);
                    setSelectedVendorForSms(null);
                    setSmsPreview(null);
                    setSmsToNumber("");
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSendSms}
                  disabled={smsSending || !smsToNumber || smsLoading}
                >
                  {smsSending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      문자 전송
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

