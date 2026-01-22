/**
 * 업체 관련 유틸리티 함수들
 */

import { VendorWithDetails } from "@/lib/supabase/types";

/**
 * 이미지 URL 생성
 * @param imagePath - 이미지 경로
 * @returns 완전한 이미지 URL
 */
export function getImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http")) return imagePath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor_images/${imagePath}`;
}

/**
 * 업체가 광고 업체인지 확인
 * @param vendor - 업체 정보
 * @returns 광고 업체 여부
 */
export function isAdvertisementVendor(vendor: VendorWithDetails): boolean {
  return (
    !!vendor.advertisement_expires_at &&
    new Date(vendor.advertisement_expires_at) > new Date()
  );
}

/**
 * 업체가 핀된 업체인지 확인
 * @param vendor - 업체 정보
 * @returns 핀된 업체 여부
 */
export function isPinnedVendor(vendor: VendorWithDetails): boolean {
  return (
    !isAdvertisementVendor(vendor) &&
    !!vendor.pin_until &&
    new Date(vendor.pin_until) > new Date()
  );
}

/**
 * 업체가 일반 업체인지 확인
 * @param vendor - 업체 정보
 * @returns 일반 업체 여부
 */
export function isRegularVendor(vendor: VendorWithDetails): boolean {
  return !isAdvertisementVendor(vendor) && !isPinnedVendor(vendor);
}

/**
 * 업체 분류 (광고, 핀, 일반)
 * @param vendors - 업체 목록
 * @returns 분류된 업체 객체
 */
export function categorizeVendors(vendors: VendorWithDetails[]) {
  const advertisementVendors = vendors.filter(isAdvertisementVendor);
  const pinnedVendors = vendors.filter(isPinnedVendor);
  const regularVendors = vendors.filter(isRegularVendor);

  return {
    advertisementVendors,
    pinnedVendors,
    regularVendors,
  };
}

/**
 * 업체 정렬 (광고 > 핀 > 일반 순서, 같은 그룹 내에서는 priority_score로 정렬)
 * @param vendors - 업체 목록
 * @returns 정렬된 업체 목록
 */
export function sortVendors(vendors: VendorWithDetails[]): VendorWithDetails[] {
  return [...vendors].sort((a, b) => {
    const aIsAd = isAdvertisementVendor(a);
    const bIsAd = isAdvertisementVendor(b);

    // 광고 업체를 먼저 표시
    if (aIsAd && !bIsAd) return -1;
    if (!aIsAd && bIsAd) return 1;

    const aIsPinned = isPinnedVendor(a);
    const bIsPinned = isPinnedVendor(b);

    // 핀된 업체를 다음에 표시
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;

    // 같은 상태라면 priority_score로 정렬
    return (b.priority_score || 0) - (a.priority_score || 0);
  });
}

/**
 * 평점 포맷팅
 * @param rating - 평점 값
 * @returns 포맷된 평점 문자열
 */
export function formatRating(rating: number | null | undefined): string {
  return rating ? rating.toFixed(1) : "0.0";
}

/**
 * 업체의 주 이미지 가져오기
 * @param vendor - 업체 정보
 * @returns 주 이미지 정보 또는 null
 */
export function getPrimaryImage(vendor: VendorWithDetails) {
  return (
    vendor.primary_image ||
    vendor.images?.find((img: any) => img.is_primary) ||
    vendor.images?.[0] ||
    (vendor as any).vendor_images?.find((img: any) => img.is_primary) ||
    (vendor as any).vendor_images?.[0] ||
    null
  );
}

/**
 * 업체의 카테고리 목록 가져오기
 * @param vendor - 업체 정보
 * @returns 카테고리 배열
 */
export function getVendorCategories(vendor: VendorWithDetails): any[] {
  return (vendor as any).vendor_categories || vendor.categories || [];
}

/**
 * 업체의 광고 이미지 가져오기 (광고 업체인 경우)
 * @param vendor - 업체 정보
 * @returns 광고 이미지 또는 주 이미지
 */
export function getAdvertisementImage(vendor: VendorWithDetails) {
  const primaryImage = getPrimaryImage(vendor);
  return vendor.advertisement_image_url || primaryImage;
}

