"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, X, Star, ImageIcon } from "lucide-react";

interface VendorImage {
  id: string;
  vendor_id: string;
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  status: string;
  created_at: string;
}

interface VendorImageManagerProps {
  vendorId: string;
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorImageManager({
  vendorId,
  vendorName,
  isOpen,
  onClose,
}: VendorImageManagerProps) {
  const [images, setImages] = useState<VendorImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/manager-api/vendors/${vendorId}/images`);
      const result = await response.json();

      if (response.ok) {
        setImages(result.data || []);
      }
    } catch (error) {
      console.error("이미지 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vendorId) {
      loadImages();
    }
  }, [isOpen, vendorId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("alt_text", altText);
      formData.append("is_primary", images.length === 0 ? "true" : "false");
      formData.append("sort_order", images.length.toString());

      const response = await fetch(`/manager-api/vendors/${vendorId}/images`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        setSelectedFile(null);
        setAltText("");
        setPreview(null);
        loadImages();
      } else {
        alert(`업로드 실패: ${result.error || result.message}`);
      }
    } catch (error: any) {
      console.error("업로드 오류:", error);
      alert(`업로드 중 오류가 발생했습니다.\n\n${error?.message || error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("이 이미지를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/manager-api/vendors/${vendorId}/images?image_id=${imageId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok && result.success !== false) {
        loadImages();
      } else {
        alert(`삭제 실패: ${result.error || result.message}`);
      }
    } catch (error: any) {
      console.error("삭제 오류:", error);
      alert(`삭제 중 오류가 발생했습니다.\n\n${error?.message || error}`);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const response = await fetch(
        `/manager-api/vendors/${vendorId}/images/${imageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_primary: true }),
        }
      );

      if (response.ok) {
        loadImages();
      }
    } catch (error) {
      console.error("대표 이미지 설정 오류:", error);
    }
  };

  const getImageUrl = (storagePath: string) => {
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${projectUrl}/storage/v1/object/public/vendor_images/${storagePath}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>업체 이미지 관리</DialogTitle>
          <DialogDescription>{vendorName}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">새 이미지 업로드</h3>

            <div className="space-y-3">
              <div>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WEBP 형식 지원 (최대 10MB)
                </p>
              </div>

              {preview && (
                <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">이미지 설명 (선택)</label>
                <Input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="이미지에 대한 설명을 입력하세요"
                  disabled={uploading}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "업로드 중..." : "업로드"}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">
              등록된 이미지 ({images.length}개)
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                로딩 중...
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>등록된 이미지가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative border rounded-lg overflow-hidden group"
                  >
                    <div className="relative w-full h-48 bg-gray-100">
                      <Image
                        src={getImageUrl(image.storage_path)}
                        alt={image.alt_text || "업체 이미지"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {image.is_primary && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        대표
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!image.is_primary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetPrimary(image.id)}
                          title="대표 이미지로 설정"
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(image.id)}
                        title="삭제"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {image.alt_text && (
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate">
                          {image.alt_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


