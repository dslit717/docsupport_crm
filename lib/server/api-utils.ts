/**
 * Manager API 공통 유틸리티 함수
 * 
 * 코딩 원칙:
 * 1. 재사용 가능한 공통 로직을 중앙화
 * 2. 일관된 에러 핸들링
 * 3. 일관된 응답 포맷
 */

import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * API 에러 응답 생성
 */
export function createErrorResponse(
  error: any,
  status: number = 500,
  customMessage?: string
) {
  console.error("API 오류:", error);
  
  const errorMessage = customMessage || 
    (error?.message || "서버 오류가 발생했습니다.");
  
  // 상세 에러 정보 추출
  const details = error?.message || error?.details || error?.hint || 
    (typeof error === 'string' ? error : JSON.stringify(error));
  
  return NextResponse.json(
    { 
      error: errorMessage,
      details: details,
      code: error?.code || error?.statusCode,
    },
    { status }
  );
}

/**
 * API 성공 응답 생성
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * 페이지네이션 파라미터 파싱
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
  };
}

/**
 * 정렬 파라미터 파싱
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  defaultField: string = "created_at",
  defaultDirection: "asc" | "desc" = "desc"
) {
  return {
    sortField: searchParams.get("sortField") || defaultField,
    sortDirection: (searchParams.get("sortDirection") || defaultDirection) as "asc" | "desc",
  };
}

/**
 * 검색 필터 적용
 */
export function applySearchFilter(
  query: any,
  search: string,
  fields: string[]
) {
  if (!search || fields.length === 0) return query;
  
  const searchConditions = fields
    .map(field => `${field}.ilike.%${search}%`)
    .join(",");
  
  return query.or(searchConditions);
}

/**
 * 페이지네이션 적용
 */
export function applyPagination(
  query: any,
  page: number,
  limit: number
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}

/**
 * 정렬 적용
 */
export function applySorting(
  query: any,
  sortField: string,
  sortDirection: "asc" | "desc"
) {
  return query.order(sortField, { ascending: sortDirection === "asc" });
}

/**
 * 카테고리 필터 적용 (vendor 전용)
 */
export async function applyCategoryFilter(
  supabase: SupabaseClient,
  categoryId: string,
  mapTableName: string = "vendor_category_map",
  foreignKeyField: string = "vendor_id"
) {
  const { data: categoryItems, error } = await supabase
    .from(mapTableName)
    .select(foreignKeyField)
    .eq("category_id", categoryId);

  if (error) {
    throw error;
  }

  const itemIds = categoryItems?.map((item: any) => item[foreignKeyField]) || [];
  return itemIds;
}

/**
 * 슬러그 생성
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 필수 필드 검증
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  
  return { valid: true };
}

/**
 * Supabase 쿼리 빌더 헬퍼
 */
export class QueryBuilder {
  private query: any;

  constructor(query: any) {
    this.query = query;
  }

  /**
   * 조건부 필터 적용
   */
  filter(condition: boolean, filterFn: (query: any) => any) {
    if (condition) {
      this.query = filterFn(this.query);
    }
    return this;
  }

  /**
   * 검색 필터
   */
  search(searchTerm: string | null, fields: string[]) {
    if (searchTerm && fields.length > 0) {
      this.query = applySearchFilter(this.query, searchTerm, fields);
    }
    return this;
  }

  /**
   * 상태 필터
   */
  status(status: string | null) {
    if (status) {
      this.query = this.query.eq("status", status);
    }
    return this;
  }

  /**
   * 정렬
   */
  sort(sortField: string, sortDirection: "asc" | "desc") {
    this.query = applySorting(this.query, sortField, sortDirection);
    return this;
  }

  /**
   * 페이지네이션
   */
  paginate(page: number, limit: number) {
    this.query = applyPagination(this.query, page, limit);
    return this;
  }

  /**
   * 쿼리 실행
   */
  async execute() {
    return await this.query;
  }

  /**
   * 원본 쿼리 반환
   */
  getQuery() {
    return this.query;
  }
}

/**
 * 카테고리와 연결된 아이템 조회 헬퍼
 */
export async function fetchItemsWithCategories(
  supabase: SupabaseClient,
  items: any[],
  mapTableName: string,
  categoryTableName: string,
  itemIdField: string = "vendor_id"
) {
  return await Promise.all(
    items.map(async (item) => {
      const { data: categoryMaps } = await supabase
        .from(mapTableName)
        .select(`
          ${categoryTableName} (
            id,
            name
          )
        `)
        .eq(itemIdField, item.id);

      const categories = categoryMaps
        ?.map((map: any) => map[categoryTableName])
        .filter(Boolean) || [];

      return {
        ...item,
        categories,
      };
    })
  );
}

/**
 * 관계 데이터 업데이트 헬퍼 (many-to-many)
 */
export async function updateRelations(
  supabase: SupabaseClient,
  itemId: string,
  relationIds: string[],
  mapTableName: string,
  itemIdField: string,
  relationIdField: string
) {
  // 기존 관계 삭제
  await supabase.from(mapTableName).delete().eq(itemIdField, itemId);

  // 새 관계 생성
  if (relationIds.length > 0) {
    const inserts = relationIds.map(relationId => ({
      [itemIdField]: itemId,
      [relationIdField]: relationId,
    }));

    const { error } = await supabase.from(mapTableName).insert(inserts);
    
    if (error) {
      console.error(`${mapTableName} 연결 오류:`, error);
    }
  }
}

