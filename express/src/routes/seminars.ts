import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/seminars
 * 세미나 목록 조회 (필터링, 검색 지원)
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const location = (req.query.location as string) || "";
    const month = (req.query.month as string) || "";
    const status = (req.query.status as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Build query
    let query = supabase
      .from("seminars")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    // Apply filters
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,organizer.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (category && category !== "전체") {
      query = query.eq("category", category);
    }

    if (location && location !== "전체") {
      query = query.ilike("location", `%${location}%`);
    }

    if (month && month !== "전체") {
      // Extract month number from "3월" format
      const monthNum = month.replace("월", "").padStart(2, "0");
      query = query.ilike("date", `%-${monthNum}-%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply sorting
    query = query.order("date", { ascending: true });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: seminars, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching seminars:", error);
      return res.status(500).json({
        error: "Failed to fetch seminars",
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: seminars || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  })
);

/**
 * GET /api/seminars/:id
 * 특정 세미나 상세 조회
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("seminars")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "세미나를 찾을 수 없습니다." });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/seminars
 * 새 세미나 생성 (관리자용)
 */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body;

    const { data: seminar, error } = await supabase
      .from("seminars")
      .insert([
        {
          title: body.title,
          category: body.category,
          location: body.location,
          date: body.date,
          time: body.time,
          participants: body.participants || 0,
          fee: body.fee,
          organizer: body.organizer,
          description: body.description,
          status: body.status || "upcoming",
          is_active: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating seminar:", error);
      return res.status(500).json({
        error: "Failed to create seminar",
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: seminar,
      message: "세미나가 생성되었습니다.",
    });
  })
);

export default router;

