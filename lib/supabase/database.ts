// 데이터베이스 관련 함수들
import { createSupabaseBrowserClient } from "./client";
import {
  Hospital,
  Vendor,
  VendorCategory,
  VendorWithDetails,
  VendorImage,
  VendorRatingStats,
  MedicalDepartment,
  BeautyProductCategory,
  BeautyProduct,
  BeautyProductWithCategory,
  BeautyProductCategoryMap,
} from "./types";

// 클라이언트용 데이터베이스 서비스
export const databaseService = {
  // 사용자 프로필 관련
  async getUserProfile(userId: string) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("user_profiles")
      .select(
        `
        id,
        email,
        name,
        speciality,
        profile_image,
        phone_number,
        identity_verified,
        medical_license,
        is_active,
        created_at,
        updated_at,
        nickname,
        avatar_url,
        provider,
        license_upload_date,
        license_verified_date
      `
      )
      .eq("id", userId)
      .single();
  },

  async updateUserProfile(userId: string, updates: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId);
  },

  async createUserProfile(profileData: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase.from("user_profiles").insert([profileData]).select();
  },

  // 채팅 세션 관련
  async getChatSessions(userId: string, category?: string) {
    const supabase = createSupabaseBrowserClient();

    let query = supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    return await query;
  },

  async createChatSession(sessionData: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase.from("chat_sessions").insert([sessionData]);
  },

  async updateChatSession(sessionId: string, updates: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("chat_sessions")
      .update(updates)
      .eq("id", sessionId);
  },

  async deleteChatSession(sessionId: string) {
    const supabase = createSupabaseBrowserClient();

    return await supabase.from("chat_sessions").delete().eq("id", sessionId);
  },

  // 채팅 메시지 관련
  async getChatMessages(sessionId: string) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
  },

  async createChatMessage(messageData: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase.from("chat_messages").insert([messageData]);
  },

  // 병원 정보 관련
  async getHospitalByUserId(userId: string) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("hospitals")
      .select("*")
      .eq("user_id", userId)
      .single();
  },

  async createHospital(hospitalData: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase.from("hospitals").insert([hospitalData]).select();
  },

  async updateHospital(hospitalId: string, updates: any) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("hospitals")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", hospitalId)
      .select();
  },

  // 업체 관련
  async getVendors(
    options: {
      category?: string;
      department?: string;
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ) {
    const { category, department, limit = 20, offset = 0, search } = options;
    const supabase = createSupabaseBrowserClient();

    let query = supabase
      .from("vendors")
      .select(
        `
        *,
        vendor_categories!inner(id, slug, name),
        vendor_images!left(id, storage_path, alt_text, is_primary)
      `
      )
      .eq("status", "published")
      .order("priority_score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("vendor_categories.slug", category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,search_text.ilike.%${search}%`);
    }

    return await query;
  },

  async getVendorCategories() {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("vendor_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
  },

  async getMedicalDepartments() {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("medical_departments")
      .select("*")
      .order("name", { ascending: true });
  },

  async getVendorById(vendorId: string) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("vendors")
      .select(
        `
        *,
        vendor_categories(id, slug, name),
        vendor_images(id, storage_path, alt_text, is_primary, sort_order)
      `
      )
      .eq("id", vendorId)
      .eq("status", "published")
      .single();
  },

  async getFeaturedVendors(limit: number = 6) {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("vendors")
      .select(
        `
        *,
        vendor_categories!inner(id, slug, name),
        vendor_images!left(id, storage_path, alt_text, is_primary)
      `
      )
      .eq("status", "published")
      .gt("priority_score", 10) // 추천 업체만
      .order("priority_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
  },

  // 메인 카테고리들을 가져오는 함수 (is_main_category가 true인 것들)
  async getMainBeautyProductCategories() {
    const supabase = createSupabaseBrowserClient();

    try {
      const result = await supabase
        .from("beauty_product_category")
        .select("*")
        .eq("is_main_category", true)
        .order("show_order", { ascending: false })
        .order("CategoryNameKO", { ascending: true });

      if (result.error) {
        console.error("getMainBeautyProductCategories 에러:", result.error);
      }

      return result;
    } catch (error) {
      console.error("getMainBeautyProductCategories 예외:", error);
      return { data: null, error };
    }
  },

  // 모든 카테고리를 가져오는 함수
  async getBeautyProductCategories() {
    const supabase = createSupabaseBrowserClient();

    return await supabase
      .from("beauty_product_category")
      .select("*")
      .order("CategoryNameKO", { ascending: true });
  },

  // 특정 카테고리들의 제품들을 가져오는 함수 (중복 선택 지원)
  async getBeautyProductsByCategories(
    categoryIds: string[],
    offset = 0,
    limit = 20
  ) {
    const supabase = createSupabaseBrowserClient();

    if (categoryIds.length === 0) {
      return { data: [], error: null };
    }

    // pseudo 카테고리 ID들을 필터링하여 검색 조건에서 제외
    const { data: pseudoCategories, error: pseudoError } = await supabase
      .from("beauty_product_category")
      .select("id")
      .in("id", categoryIds)
      .eq("is_pseudo_category", true);

    if (pseudoError) {
      console.error("pseudo 카테고리 조회 오류:", pseudoError);
      return { data: [], error: pseudoError };
    }

    // pseudo 카테고리 ID들을 제외한 실제 검색할 카테고리 ID들
    const pseudoCategoryIds = pseudoCategories?.map((cat) => cat.id) || [];
    const actualCategoryIds = categoryIds.filter(
      (id) => !pseudoCategoryIds.includes(id)
    );

    // 실제 검색할 카테고리가 없으면 빈 결과 반환
    if (actualCategoryIds.length === 0) {
      return { data: [], error: null };
    }

    // 단일 카테고리인 경우 기존 함수 사용
    if (actualCategoryIds.length === 1) {
      return await this.getBeautyProductsByCategory(
        actualCategoryIds[0],
        offset,
        limit
      );
    }

    // 여러 카테고리에 모두 속하는 제품 ID들을 찾기
    const { data: productMappings, error: mappingError } = await supabase
      .from("beauty_product_category_map_uuid")
      .select("product_id, category_id")
      .in("category_id", actualCategoryIds);

    if (mappingError || !productMappings) {
      return { data: [], error: mappingError };
    }

    // 각 제품이 선택된 모든 카테고리에 속하는지 확인
    const productCategoryCount = new Map<string, Set<string>>();

    productMappings.forEach((mapping) => {
      if (!productCategoryCount.has(mapping.product_id)) {
        productCategoryCount.set(mapping.product_id, new Set());
      }
      productCategoryCount.get(mapping.product_id)!.add(mapping.category_id);
    });

    // 모든 선택된 카테고리에 속하는 제품 ID들만 필터링
    const validProductIds = Array.from(productCategoryCount.entries())
      .filter(([_, categories]) => categories.size === actualCategoryIds.length)
      .map(([productId, _]) => productId);

    if (validProductIds.length === 0) {
      return { data: [], error: null };
    }

    // 제품 정보와 모든 카테고리 정보를 함께 가져옴
    const { data: products, error } = await supabase
      .from("beauty_products")
      .select(
        `
        *,
        beauty_product_category_map_uuid(
          category_id,
          beauty_product_category(
            id,
            "CategoryID",
            "CategoryName",
            "CategoryNameKO",
            "CategoryDetail",
            "CategorySEO"
          )
        )
      `
      )
      .in("id", validProductIds)
      .order("ProductName", { ascending: true })
      .range(offset, offset + limit - 1);

    return { data: products || [], error };
  },

  // 단일 카테고리의 제품들을 가져오는 함수 (기존 함수 유지)
  async getBeautyProductsByCategory(
    categoryId: string,
    offset = 0,
    limit = 20
  ) {
    const supabase = createSupabaseBrowserClient();

    // 먼저 해당 카테고리에 속하는 제품 ID들을 가져옴
    const { data: productIds, error: productIdsError } = await supabase
      .from("beauty_product_category_map_uuid")
      .select("product_id")
      .eq("category_id", categoryId);

    if (productIdsError || !productIds) {
      return { data: [], error: productIdsError };
    }

    const uniqueProductIds = [...new Set(productIds.map((p) => p.product_id))];

    if (uniqueProductIds.length === 0) {
      return { data: [], error: null };
    }

    // 제품 정보와 모든 카테고리 정보를 함께 가져옴
    const { data: products, error } = await supabase
      .from("beauty_products")
      .select(
        `
        *,
        beauty_product_category_map_uuid(
          category_id,
          beauty_product_category(
            id,
            "CategoryID",
            "CategoryName",
            "CategoryNameKO",
            "CategoryDetail",
            "CategorySEO"
          )
        )
      `
      )
      .in("id", uniqueProductIds)
      .order("ProductName", { ascending: true })
      .range(offset, offset + limit - 1);

    return { data: products || [], error };
  },

  // 카테고리 정보를 slug로 가져오는 함수
  async getBeautyProductCategoryBySlug(slug: string) {
    const supabase = createSupabaseBrowserClient();

    // 먼저 CategorySEO로 검색
    let result = await supabase
      .from("beauty_product_category")
      .select("*")
      .eq("CategorySEO", slug)
      .single();

    // CategorySEO에서 찾지 못한 경우 CategoryNameKO로 검색
    if (!result.data) {
      result = await supabase
        .from("beauty_product_category")
        .select("*")
        .eq("CategoryNameKO", slug)
        .single();
    }

    return result;
  },

  // 카테고리의 하위 카테고리들을 가져오는 함수
  async getBeautyProductSubCategories(categoryId: string) {
    const supabase = createSupabaseBrowserClient();

    // 먼저 카테고리 정보를 가져옴
    const { data: category } = await supabase
      .from("beauty_product_category")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (!category || !category.category_children_uuids) {
      return { data: [], error: null };
    }

    // 해당 카테고리의 하위 카테고리들을 가져옴
    const subCategoryIds = category.category_children_uuids;
    if (subCategoryIds.length === 0) {
      return { data: [], error: null };
    }

    return await supabase
      .from("beauty_product_category")
      .select("*")
      .in("id", subCategoryIds)
      .order("CategoryNameKO", { ascending: true });
  },
};

// 서버용 데이터베이스 서비스는 별도 파일로 분리
// 사용 시: import { serverDatabaseService } from '@/lib/supabase/database-server'
