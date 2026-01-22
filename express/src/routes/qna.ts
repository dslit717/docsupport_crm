import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/qna
 * 질문 목록 조회
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const categoryId = (req.query.category as string) || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query with category join
    let query = supabase
      .from("questions")
      .select(
        `
        *,
        category:qna_categories(id, name, slug)
      `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Add category filter if provided
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({
        success: false,
        error: "질문 목록을 불러오는데 실패했습니다.",
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  })
);

/**
 * GET /api/qna/categories
 * Q&A 카테고리 목록 조회
 */
router.get(
  "/categories",
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from("qna_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: "카테고리 목록을 불러오는데 실패했습니다.",
      });
    }

    res.json({
      success: true,
      data: data || [],
    });
  })
);

/**
 * GET /api/qna/:id
 * 특정 질문 상세 조회
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("questions")
      .select(
        `
        *,
        category:qna_categories(id, name, slug)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: "질문을 찾을 수 없습니다.",
      });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/qna
 * 질문 등록
 */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { title, content, categoryId } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "제목과 내용을 입력해주세요.",
      });
    }

    // Get client IP address
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "";

    // Insert question
    const { data, error } = await supabase
      .from("questions")
      .insert({
        title,
        content,
        author_id: user.id,
        author_ip: ip,
        category_id: categoryId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating question:", error);
      return res.status(500).json({
        success: false,
        error: "질문 등록에 실패했습니다.",
      });
    }

    res.json({ success: true, data });
  })
);

/**
 * GET /api/qna/:id/answers
 * 특정 질문의 답변 목록 조회
 */
router.get(
  "/:id/answers",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: "답변 목록을 불러오는데 실패했습니다.",
      });
    }

    res.json({ success: true, data: data || [] });
  })
);

/**
 * POST /api/qna/:id/answers
 * 답변 등록
 */
router.post(
  "/:id/answers",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "답변 내용을 입력해주세요.",
      });
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "";

    const { data, error } = await supabase
      .from("answers")
      .insert({
        question_id: id,
        content,
        author_id: user.id,
        author_ip: ip,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "답변 등록에 실패했습니다.",
      });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/qna/:id/vote
 * 질문에 투표
 */
router.post(
  "/:id/vote",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const { type } = req.body; // 'up' or 'down'

    if (!type || !["up", "down"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "올바른 투표 타입을 입력해주세요.",
      });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("question_votes")
      .select("*")
      .eq("question_id", id)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from("question_votes")
        .update({ vote_type: type })
        .eq("id", existingVote.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: "투표 업데이트에 실패했습니다.",
        });
      }
    } else {
      // Create new vote
      const { error: insertError } = await supabase
        .from("question_votes")
        .insert({
          question_id: id,
          user_id: user.id,
          vote_type: type,
        });

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: "투표에 실패했습니다.",
        });
      }
    }

    res.json({ success: true, message: "투표가 완료되었습니다." });
  })
);

export default router;

