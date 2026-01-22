const SUPABASE_STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_imgs`
    : "https://ondqdzenruquvliuwjxm.supabase.co/storage/v1/object/public/product_imgs";

/**
 * ProductDetailImage 필드값으로 제품 이미지 URL을 생성합니다.
 * @param imageName - ProductDetailImage 필드의 이미지 파일명
 * @returns Supabase Storage의 제품 이미지 URL
 */
export function getProductImageUrl(imageName: string | null | undefined): string | null {
  if (!imageName) return null;
  return `${SUPABASE_STORAGE_URL}/${imageName}`;
}

/**
 * @deprecated 기존 ProductID 기반 URL 생성 (하위 호환성)
 * @param productId - 제품 ID
 * @returns Supabase Storage의 제품 이미지 URL
 */
export function getProductImageUrlByProductId(productId: string | number): string {
  return `${SUPABASE_STORAGE_URL}/${productId}.jpg`;
}

/**
 * 제품 이미지 URL이 유효한지 확인합니다.
 * @param imageUrl - 이미지 URL
 * @returns 이미지 로드 가능 여부
 */
export async function checkImageExists(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 제품 이미지 URL 또는 기본 플레이스홀더를 반환합니다.
 * @param imageName - ProductDetailImage 필드의 이미지 파일명
 * @param fallbackUrl - 대체 이미지 URL (선택)
 * @returns 이미지 URL
 */
export function getProductImageUrlWithFallback(
  imageName: string | null | undefined,
  fallbackUrl: string = "/placeholder.svg"
): string {
  const imageUrl = getProductImageUrl(imageName);
  return imageUrl || fallbackUrl;
}
