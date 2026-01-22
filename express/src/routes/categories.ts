import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * GET /api/categories
 * 카테고리 목록 조회
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("vendor_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("카테고리 조회 오류:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      data: data || [],
    });
  })
);

export default router;

