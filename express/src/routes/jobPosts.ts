import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/job-posts
 * 구인글 목록 조회
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const location = (req.query.location as string) || "";
    const jobType = (req.query.jobType as string) || "";
    const department = (req.query.department as string) || "";
    const search = (req.query.search as string) || "";

    let query = supabase
      .from("job_posts")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString()) // 만료되지 않은 구인글만
      .order("is_paid", { ascending: false })
      .order("urgent", { ascending: false })
      .order("created_at", { ascending: false });

    // 지역 필터
    if (location && location !== "전체") {
      query = query.ilike("location", `%${location}%`);
    }

    // 고용형태 필터
    if (jobType && jobType !== "전체") {
      query = query.eq("job_type", jobType);
    }

    // 진료과목 필터
    if (department && department !== "전체") {
      query = query.contains("departments", [department]);
    }

    // 검색
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,hospital_name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // 총 개수 조회
    const { count, error: countError } = await query;

    if (countError) {
      console.error("개수 조회 오류:", countError);
      return res.status(400).json({ error: countError.message });
    }

    // 페이지네이션 적용
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("데이터 조회 오류:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      data: data || [],
      total: count || 0,
    });
  })
);

/**
 * GET /api/job-posts/:id
 * 특정 구인글 상세 조회
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "구인글을 찾을 수 없습니다." });
    }

    res.json({ data });
  })
);

/**
 * POST /api/job-posts
 * 구인글 등록
 */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;

    // 활성화된 구인글이 이미 있는지 확인
    const { data: existingPosts, error: checkError } = await supabase
      .from("job_posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (checkError) {
      console.error("기존 구인글 확인 오류:", checkError);
    }

    if (existingPosts && existingPosts.length > 0) {
      return res.status(400).json({
        error:
          "활성화된 구인글이 이미 존재합니다. 하나의 구인글만 올릴 수 있습니다.",
      });
    }

    const {
      title,
      hospital_name,
      location,
      job_type,
      salary,
      experience,
      description,
      full_description,
      contact_email,
      contact_phone,
      departments,
      is_paid,
      urgent,
    } = req.body;

    // 필수 필드 검증
    if (!title || !hospital_name || !location || !job_type || !description) {
      return res.status(400).json({
        error: "필수 필드를 모두 입력해주세요.",
      });
    }

    if (!departments || departments.length === 0) {
      return res.status(400).json({
        error: "진료과목을 하나 이상 선택해주세요.",
      });
    }

    // 만료일 설정 (기본 7일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("job_posts")
      .insert({
        user_id: user.id,
        title,
        hospital_name,
        location,
        job_type,
        salary,
        experience,
        description,
        full_description,
        contact_email,
        contact_phone,
        departments,
        is_paid: is_paid || false,
        paid_ad_approved: false,
        urgent: urgent || false,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("구인글 등록 오류:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  })
);

/**
 * PUT /api/job-posts/:id
 * 구인글 수정
 */
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    // 본인 구인글인지 확인
    const { data: existingPost } = await supabase
      .from("job_posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return res.status(403).json({ error: "수정 권한이 없습니다." });
    }

    const {
      title,
      hospital_name,
      location,
      job_type,
      salary,
      experience,
      description,
      full_description,
      contact_email,
      contact_phone,
      departments,
    } = req.body;

    const { data, error } = await supabase
      .from("job_posts")
      .update({
        title,
        hospital_name,
        location,
        job_type,
        salary,
        experience,
        description,
        full_description,
        contact_email,
        contact_phone,
        departments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  })
);

/**
 * DELETE /api/job-posts/:id
 * 구인글 삭제
 */
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    // 본인 구인글인지 확인
    const { data: existingPost } = await supabase
      .from("job_posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return res.status(403).json({ error: "삭제 권한이 없습니다." });
    }

    const { error } = await supabase
      .from("job_posts")
      .update({ status: "deleted" })
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: "구인글이 삭제되었습니다." });
  })
);

export default router;

