import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * GET /api/societies
 * 학회 목록 조회
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const category = req.query.category as string;
    const search = req.query.search as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // 기본 쿼리 구성
    let query = supabase
      .from("medical_societies")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    // 카테고리 필터
    if (category) {
      query = query.eq("category", category);
    }

    // 검색 필터
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("학회 목록 조회 오류:", error);
      return res.status(500).json({
        error: "학회 목록을 불러오는데 실패했습니다.",
      });
    }

    res.json({
      data,
      total: count || 0,
    });
  })
);

/**
 * GET /api/societies/:id
 * 특정 학회 상세 조회
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("medical_societies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "학회를 찾을 수 없습니다." });
    }

    res.json({ data });
  })
);

export default router;

