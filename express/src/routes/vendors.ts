import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * GET /api/vendors
 * 업체 목록 조회 (공개용)
 *
 * Query Parameters:
 * - limit: 한 페이지당 항목 수 (기본값: 50)
 * - offset: 시작 위치 (기본값: 0)
 * - search: 검색어 (업체명, 설명, 전화번호)
 * - category: 카테고리 slug
 * - region: 지역(state)
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const region = (req.query.region as string) || "";

    // 기본 쿼리 빌더 (데이터 조회용)
    let query = supabase
      .from("vendors")
      .select("*")
      .eq("status", "published")
      .order("priority_score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 카운트 쿼리 빌더 (총 개수 조회용)
    let countQuery = supabase
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    // 검색 필터
    if (search) {
      const searchFilter = `name.ilike.%${search}%,description_md.ilike.%${search}%,phone.ilike.%${search}%`;
      query = query.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // 카테고리 필터
    if (category) {
      const { data: categoryData, error: categoryLookupError } = await supabase
        .from("vendor_categories")
        .select("id")
        .eq("slug", category)
        .single();

      if (categoryLookupError || !categoryData) {
        return res.json({ data: [], total: 0 });
      }

      const { data: categoryVendors, error: categoryError } = await supabase
        .from("vendor_category_map")
        .select("vendor_id")
        .eq("category_id", categoryData.id);

      if (categoryError) {
        return res.status(400).json({ error: categoryError.message });
      }

      const vendorIds = categoryVendors?.map((item) => item.vendor_id) || [];

      if (vendorIds.length === 0) {
        return res.json({ data: [], total: 0 });
      }

      query = query.in("id", vendorIds);
      countQuery = countQuery.in("id", vendorIds);
    }

    // 지역 필터
    if (region) {
      query = query.eq("state", region);
      countQuery = countQuery.eq("state", region);
    }

    // 총 개수 조회 (필터 적용된 결과)
    const { count, error: countError } = await countQuery;

    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    // 페이지네이션 데이터 조회
    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 각 업체의 이미지 정보 조회
    const vendorsWithImages = await Promise.all(
      (data || []).map(async (vendor) => {
        const { data: images } = await supabase
          .from("vendor_images")
          .select("*")
          .eq("vendor_id", vendor.id)
          .eq("status", "approved")
          .order("is_primary", { ascending: false })
          .order("sort_order", { ascending: true });

        return {
          ...vendor,
          images: images || [],
        };
      })
    );

    res.json({
      data: vendorsWithImages,
      total: count || 0,
    });
  })
);

/**
 * GET /api/vendors/:id
 * 특정 업체 상세 조회
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "업체를 찾을 수 없습니다." });
    }

    // 이미지 조회
    const { data: images } = await supabase
      .from("vendor_images")
      .select("*")
      .eq("vendor_id", id)
      .eq("status", "approved")
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true });

    res.json({
      data: {
        ...vendor,
        images: images || [],
      },
    });
  })
);

export default router;

