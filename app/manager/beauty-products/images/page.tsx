"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Upload,
  ImageIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Product {
  id: string;
  product_id: string; // ProductID (숫자)
  name: string;
  name_en?: string;
  brand: string;
  is_active?: boolean;
  image_name?: string; // ProductDetailImage 필드 (이미지 파일명)
}

// Supabase Storage URL 생성 함수
const getProductImageUrl = (imageName: string | null | undefined) => {
  if (!imageName) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/product_imgs/${imageName}`;
};

export default function ProductImagesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [imageTimestamps, setImageTimestamps] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 페이지네이션
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 제품 목록 로드 (beauty_product_detail 뷰 활용, 활성화 제품만)
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      // 이미지 관리 전용 API 사용 (단일 요청으로 데이터 + count)
      const response = await fetch(`/manager-api/beauty-products/images?${params}`);
      const result = await response.json();

      if (response.ok) {
        setProducts(result.data || []);
        setPagination((prev) => ({
          ...prev,
          total: result.count || 0,
          totalPages: result.totalPages || Math.ceil((result.count || 0) / prev.limit),
        }));
        // 이미지 에러 상태 초기화
        setImageErrors({});
      } else {
        console.error("제품 목록 로드 실패:", result.error);
      }
    } catch (error) {
      console.error("제품 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [pagination.page, pagination.limit, searchQuery]);

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("지원하지 않는 파일 형식입니다. (jpg, png, gif, webp만 가능)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setSelectedFile(file);
    
    // 미리보기 URL 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드
  const handleUpload = async () => {
    if (!selectedProduct || !selectedFile) return;

    setUploading(selectedProduct.id);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("product_id", selectedProduct.id); // UUID 사용

      const response = await fetch("/manager-api/beauty-products/images", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      console.log("업로드 응답:", { status: response.status, result });

      if (response.ok) {
        setUploadSuccess(selectedProduct.id);
        // 이미지 타임스탬프 업데이트 (캐시 무효화)
        setImageTimestamps((prev) => ({
          ...prev,
          [selectedProduct.id]: Date.now(),
        }));
        // 이미지 에러 상태 초기화
        setImageErrors((prev) => ({
          ...prev,
          [selectedProduct.id]: false,
        }));
        // 제품 목록 새로고침 (image_name 업데이트 반영)
        await loadProducts();
        setTimeout(() => setUploadSuccess(null), 3000);
        setIsUploadDialogOpen(false);
        resetUploadState();
      } else {
        // 상세 에러 메시지 표시
        const errorMessage = result.error || result.message || "알 수 없는 오류";
        const errorDetails = result.details || "";
        console.error("업로드 실패:", { status: response.status, result });
        alert(`업로드 실패 (${response.status})\n\n오류: ${errorMessage}${errorDetails ? `\n상세: ${errorDetails}` : ""}`);
      }
    } catch (error: any) {
      console.error("업로드 오류:", error);
      alert(`이미지 업로드 중 오류가 발생했습니다.\n\n${error?.message || error}`);
    } finally {
      setUploading(null);
    }
  };

  // 업로드 상태 초기화
  const resetUploadState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 업로드 다이얼로그 열기
  const openUploadDialog = (product: Product) => {
    setSelectedProduct(product);
    resetUploadState();
    setIsUploadDialogOpen(true);
  };

  // 이미지 로드 에러 핸들러
  const handleImageError = (productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  // 이미지 URL with 캐시 버스팅
  const getImageUrlWithCache = (productId: string, imageName: string | null | undefined) => {
    const baseUrl = getProductImageUrl(imageName);
    if (!baseUrl) return null;
    const timestamp = imageTimestamps[productId] || 0;
    return timestamp ? `${baseUrl}?t=${timestamp}` : baseUrl;
  };

  // 이미지 존재 여부 확인
  const hasImage = (product: Product) => {
    return !!product.image_name && !imageErrors[product.id];
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/beauty-products/images" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">제품 이미지 관리</h1>
          <p className="text-gray-600 mt-2">
            뷰티 제품의 이미지를 업로드하고 관리할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>제품 목록</CardTitle>
                <CardDescription>
                  활성화된 제품 {pagination.total}개 중 {products.length}개 표시
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="제품명, 영문명, 제조사 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadProducts()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">이미지</TableHead>
                      <TableHead>ProductID</TableHead>
                      <TableHead>제품명</TableHead>
                      <TableHead>영문명</TableHead>
                      <TableHead>제조사</TableHead>
                      <TableHead>이미지 상태</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const imageUrl = getImageUrlWithCache(product.id, product.image_name);
                      const showImage = imageUrl && !imageErrors[product.id];
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                              {!showImage ? (
                                <div className="flex items-center justify-center h-full">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              ) : (
                                <Image
                                  src={imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  onError={() => handleImageError(product.id)}
                                  unoptimized
                                />
                              )}
                              {uploadSuccess === product.id && (
                                <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                                  <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.product_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {product.name_en || "-"}
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            {product.image_name ? (
                              <Badge variant="default" className="bg-blue-100 text-blue-800">
                                등록됨
                              </Badge>
                            ) : (
                              <Badge variant="secondary">미등록</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => openUploadDialog(product)}
                              disabled={uploading === product.id}
                            >
                              {uploading === product.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {product.image_name ? "이미지 변경" : "이미지 등록"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* 페이지네이션 */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      페이지 {pagination.page} / {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.max(1, prev.page - 1),
                          }))
                        }
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.min(prev.totalPages, prev.page + 1),
                          }))
                        }
                        disabled={pagination.page === pagination.totalPages}
                      >
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 이미지 업로드 다이얼로그 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>제품 이미지 {selectedProduct?.image_name ? "변경" : "등록"}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} (ProductID: {selectedProduct?.product_id})의 이미지를 {selectedProduct?.image_name ? "변경" : "등록"}합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 현재 이미지 */}
            <div>
              <p className="text-sm font-medium mb-2">현재 이미지</p>
              <div className="relative w-full h-48 bg-gray-100 rounded overflow-hidden">
                {selectedProduct?.image_name && !imageErrors[selectedProduct.id] ? (
                  <Image
                    src={getImageUrlWithCache(selectedProduct.id, selectedProduct.image_name) || ""}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain"
                    onError={() =>
                      selectedProduct && handleImageError(selectedProduct.id)
                    }
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm">이미지 없음</p>
                  </div>
                )}
              </div>
            </div>

            {/* 새 이미지 업로드 */}
            <div>
              <p className="text-sm font-medium mb-2">새 이미지 선택</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                {previewUrl ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={previewUrl}
                      alt="미리보기"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Upload className="h-10 w-10 mx-auto mb-2" />
                    <p>클릭하여 이미지를 선택하세요</p>
                    <p className="text-xs mt-1">JPG, PNG, GIF, WebP (최대 5MB)</p>
                  </div>
                )}
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  선택된 파일: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {selectedProduct?.image_name ? (
                  <>⚠️ 업로드 시 기존 이미지가 삭제되고 새 이미지로 교체됩니다.</>
                ) : (
                  <>📷 이미지가 등록되면 제품 상세 페이지에 표시됩니다.</>
                )}
                <br />
                <span className="text-xs text-blue-600">
                  지원 형식: JPG, PNG, GIF, WebP (최대 5MB)
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                resetUploadState();
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading !== null}
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  이미지 변경
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

