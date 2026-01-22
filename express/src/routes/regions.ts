import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * GET /api/regions
 * 서비스 지역 목록 조회
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("vendors")
      .select("service_areas")
      .eq("status", "published")
      .not("service_areas", "is", null)
      .order("service_areas", { ascending: true });

    if (error) {
      console.error("서비스 지역 조회 오류:", error);
      return res.status(400).json({ error: error.message });
    }

    // 쉼표로 구분된 지역들을 분리하고 중복 제거
    const allRegions =
      data
        ?.flatMap((item) =>
          item.service_areas
            ?.split(",")
            .map((region: string) => region.trim())
            .filter(Boolean)
        )
        .filter(Boolean) || [];

    const uniqueRegions = [...new Set(allRegions)].sort();

    res.json({
      data: uniqueRegions,
    });
  })
);

export default router;

