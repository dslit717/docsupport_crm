/**
 * 피부성형제품 관련 유틸리티 함수들
 */

import { BeautyProductCategory } from "@/lib/supabase/types";

/**
 * 선택된 카테고리들을 슬러그로 변환
 * @param categoryIds - 선택된 카테고리 ID 배열
 * @param allCategories - 전체 카테고리 목록
 * @returns 슬러그 문자열 (& 로 연결)
 */
export function generateSlugFromCategories(
  categoryIds: string[],
  allCategories: BeautyProductCategory[]
): string {
  const selectedCategoryObjects = allCategories.filter((cat) =>
    categoryIds.includes(cat.id)
  );

  const slugs = selectedCategoryObjects.map(
    (cat) =>
      cat.CategorySEO ||
      cat.CategoryNameKO.replace(/[^a-zA-Z0-9가-힣]/g, "-").replace(/-+/g, "-")
  );

  return slugs.join("&");
}

/**
 * 카테고리 ID로 카테고리 찾기
 * @param categoryId - 찾을 카테고리 ID
 * @param mainCategories - 메인 카테고리 목록
 * @param subCategoriesGrouped - 그룹화된 하위 카테고리
 * @returns 찾은 카테고리 또는 null
 */
export function findCategoryById(
  categoryId: string,
  mainCategories: BeautyProductCategory[],
  subCategoriesGrouped: { [key: string]: BeautyProductCategory[] }
): BeautyProductCategory | null {
  // 메인 카테고리에서 찾기
  let category = mainCategories.find((c) => c.id === categoryId);

  // 하위 카테고리에서 찾기
  if (!category) {
    for (const subCats of Object.values(subCategoriesGrouped)) {
      const found = subCats.find((c) => c.id === categoryId);
      if (found) {
        category = found;
        break;
      }
    }
  }

  return category || null;
}

/**
 * 모든 카테고리 목록 생성
 * @param mainCategories - 메인 카테고리 목록
 * @param subCategoriesGrouped - 그룹화된 하위 카테고리
 * @returns 전체 카테고리 배열
 */
export function getAllCategories(
  mainCategories: BeautyProductCategory[],
  subCategoriesGrouped: { [key: string]: BeautyProductCategory[] }
): BeautyProductCategory[] {
  return [...mainCategories, ...Object.values(subCategoriesGrouped).flat()];
}

/**
 * 하위 카테고리 선택 상태 확인
 * @param subCategories - 하위 카테고리 목록
 * @param selectedCategories - 선택된 카테고리 ID 배열
 * @returns 선택 상태 정보
 */
export function getSubCategorySelectionState(
  subCategories: BeautyProductCategory[],
  selectedCategories: string[]
) {
  const allSubSelected = subCategories.every((cat) =>
    selectedCategories.includes(cat.id)
  );
  const someSubSelected = subCategories.some((cat) =>
    selectedCategories.includes(cat.id)
  );

  return { allSubSelected, someSubSelected };
}

/**
 * 다른 하위 카테고리 ID 추출
 * @param subCategories - 하위 카테고리 목록
 * @param excludeId - 제외할 카테고리 ID
 * @returns 다른 하위 카테고리 ID 배열
 */
export function getOtherSubCategoryIds(
  subCategories: BeautyProductCategory[],
  excludeId: string
): string[] {
  return subCategories.filter((cat) => cat.id !== excludeId).map((cat) => cat.id);
}

