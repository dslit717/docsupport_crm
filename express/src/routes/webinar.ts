import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/webinar
 * 웨비나 목록 조회
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("webinars")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("scheduled_date", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("웨비나 목록 조회 오류:", error);
      return res.status(500).json({
        success: false,
        error: "웨비나 목록을 불러오는데 실패했습니다.",
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
 * GET /api/webinar/:id
 * 특정 웨비나 상세 조회
 */
router.get(
  "/:id",
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("webinars")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: "웨비나를 찾을 수 없습니다.",
      });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/webinar/:id/rebroadcast-request
 * 재방송 요청
 */
router.post(
  "/:id/rebroadcast-request",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    // 이미 요청했는지 확인
    const { data: existingRequest } = await supabase
      .from("webinar_rebroadcast_requests")
      .select("id")
      .eq("webinar_id", id)
      .eq("user_id", user.id)
      .single();

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: "이미 재방송 요청을 하셨습니다.",
      });
    }

    // 재방송 요청 추가
    const { error: insertError } = await supabase
      .from("webinar_rebroadcast_requests")
      .insert({
        webinar_id: id,
        user_id: user.id,
      });

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: "재방송 요청에 실패했습니다.",
      });
    }

    // 요청 수 업데이트
    const { error: updateError } = await supabase.rpc(
      "increment_rebroadcast_requests",
      { webinar_id: id }
    );

    if (updateError) {
      console.error("재방송 요청 수 업데이트 오류:", updateError);
    }

    res.json({
      success: true,
      message: "재방송 요청이 접수되었습니다.",
    });
  })
);

/**
 * POST /api/webinar/:id/interested
 * 관심 표시 (보고싶어요)
 */
router.post(
  "/:id/interested",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    // 이미 관심 표시했는지 확인
    const { data: existingInterest } = await supabase
      .from("webinar_interests")
      .select("id")
      .eq("webinar_id", id)
      .eq("user_id", user.id)
      .single();

    if (existingInterest) {
      return res.status(400).json({
        success: false,
        error: "이미 관심 표시를 하셨습니다.",
      });
    }

    // 관심 표시 추가
    const { error: insertError } = await supabase
      .from("webinar_interests")
      .insert({
        webinar_id: id,
        user_id: user.id,
      });

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: "관심 표시에 실패했습니다.",
      });
    }

    // 관심 수 업데이트
    const { error: updateError } = await supabase.rpc(
      "increment_interested_count",
      { webinar_id: id }
    );

    if (updateError) {
      console.error("관심 수 업데이트 오류:", updateError);
    }

    res.json({
      success: true,
      message: "관심 표시가 완료되었습니다. 시청 알림이 카카오톡으로 전송됩니다.",
    });
  })
);

/**
 * POST /api/webinar/:id/view
 * 조회수 증가
 */
router.post(
  "/:id/view",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabase.rpc("increment_webinar_views", {
      webinar_id: id,
    });

    if (error) {
      console.error("조회수 업데이트 오류:", error);
    }

    res.json({ success: true });
  })
);

/**
 * POST /api/webinar
 * 웨비나 생성 (관리자용)
 */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body;

    const { data, error } = await supabase
      .from("webinars")
      .insert({
        title: body.title,
        description: body.description,
        scheduled_date: body.scheduled_date,
        thumbnail: body.thumbnail,
        presenter: body.presenter,
        duration: body.duration,
        status: body.status || "scheduled",
        vimeo_embed_url: body.vimeo_embed_url,
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: "웨비나 생성에 실패했습니다.",
      });
    }

    res.json({
      success: true,
      data,
      message: "웨비나가 생성되었습니다.",
    });
  })
);

export default router;

