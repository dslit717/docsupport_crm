import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * GET /api/beauty-products
 * 피부성형제품 목록 조회
 *
 * Query Parameters:
 * - categoryIds: 카테고리 ID 배열 (쉼표로 구분)
 * - limit: 한 페이지당 항목 수 (기본값: 20)
 * - offset: 시작 위치 (기본값: 0)
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const categoryIdsParam = (req.query.categoryIds as string) || "";
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // 카테고리 ID 파싱
    const categoryIds = categoryIdsParam
      .split(",")
      .filter((id) => id.trim().length > 0);

    if (categoryIds.length === 0) {
      return res.json({ data: [], total: 0 });
    }

    // 1. pseudo 카테고리 필터링
    const { data: categories, error: catError } = await supabase
      .from("beauty_product_category")
      .select("id, is_pseudo_category")
      .in("id", categoryIds);

    if (catError) {
      return res.status(400).json({ error: catError.message });
    }

    // pseudo 카테고리가 아닌 실제 카테고리 ID만 추출
    const actualCategoryIds =
      categories
        ?.filter((cat) => !cat.is_pseudo_category)
        .map((cat) => cat.id) || [];

    if (actualCategoryIds.length === 0) {
      return res.json({ data: [], total: 0 });
    }

    // 2. 단일 카테고리인 경우 - 간단한 조회
    if (actualCategoryIds.length === 1) {
      const categoryId = actualCategoryIds[0];

      // 해당 카테고리의 제품 ID들 조회
      const { data: productIds, error: productIdsError } = await supabase
        .from("beauty_product_category_map_uuid")
        .select("product_id")
        .eq("category_id", categoryId);

      if (productIdsError || !productIds) {
        return res.json({ data: [], total: 0 });
      }

      const uniqueProductIds = [
        ...new Set(productIds.map((p) => p.product_id)),
      ];

      if (uniqueProductIds.length === 0) {
        return res.json({ data: [], total: 0 });
      }

      // 제품 정보 조회 (활성 제품만)
      const { data: products, error: productsError } = await supabase
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
        .eq("is_active", true)
        .order("ProductName", { ascending: true })
        .range(offset, offset + limit - 1);

      if (productsError) {
        return res.status(400).json({ error: productsError.message });
      }

      return res.json({
        data: products || [],
        total: products?.length || 0,
      });
    }

    // 3. 다중 카테고리인 경우 - 교집합 조회
    const { data: productMappings, error: mappingError } = await supabase
      .from("beauty_product_category_map_uuid")
      .select("product_id, category_id")
      .in("category_id", actualCategoryIds);

    if (mappingError || !productMappings) {
      return res.json({ data: [], total: 0 });
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
    const matchingProductIds = Array.from(productCategoryCount.entries())
      .filter(
        ([_, categories]) => categories.size === actualCategoryIds.length
      )
      .map(([productId]) => productId);

    if (matchingProductIds.length === 0) {
      return res.json({ data: [], total: 0 });
    }

    // 제품 정보 조회 (활성 제품만)
    const { data: products, error: productsError } = await supabase
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
      .in("id", matchingProductIds)
      .eq("is_active", true)
      .order("ProductName", { ascending: true })
      .range(offset, offset + limit - 1);

    if (productsError) {
      return res.status(400).json({ error: productsError.message });
    }

    res.json({
      data: products || [],
      total: products?.length || 0,
    });
  })
);

/**
 * GET /api/beauty-products/categories
 * 제품 카테고리 목록 조회
 */
router.get(
  "/categories",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("beauty_product_category")
      .select("*")
      .order("CategoryNameKO", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ data: data || [] });
  })
);

/**
 * GET /api/beauty-products/:productId
 * 특정 제품 상세 조회
 */
router.get(
  "/:productId",
  asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const { data, error } = await supabase
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
      .eq("id", productId)
      .single();

    if (error) {
      return res.status(404).json({ error: "제품을 찾을 수 없습니다." });
    }

    res.json({ data });
  })
);

export default router;

