import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/clinic-locations
 * 개원자리 목록 조회 (필터링, 검색, 페이지네이션 지원)
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const search = (req.query.search as string) || "";
    const region = (req.query.region as string) || "";
    const type = (req.query.type as string) || "";
    const minSize = (req.query.minSize as string) || "";
    const maxSize = (req.query.maxSize as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const showAll = req.query.showAll === "true"; // 관리자용 옵션

    // Build query
    let query = supabase
      .from("clinic_locations")
      .select("*", { count: "exact" });

    // 관리자가 아닌 경우에만 활성 항목만 필터링
    if (!showAll) {
      query = query.eq("is_active", true);
    }

    // Apply filters
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,address.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (region && region !== "전체") {
      query = query.eq("region", region);
    }

    if (type && type !== "전체") {
      query = query.eq("type", type);
    }

    if (minSize) {
      query = query.gte("size_sqm", parseFloat(minSize));
    }

    if (maxSize) {
      query = query.lte("size_sqm", parseFloat(maxSize));
    }

    // Apply sorting
    const sortBy = (req.query.sortBy as string) || "created_at";
    const sortDirection = (req.query.sortDirection as string) || "desc";
    query = query.order(sortBy, {
      ascending: sortDirection === "asc",
    });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: locations, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching clinic locations:", error);
      return res.status(500).json({
        error: "Failed to fetch clinic locations",
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: locations || [],
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
 * GET /api/clinic-locations/:id
 * 특정 개원자리 상세 조회
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("clinic_locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "개원자리를 찾을 수 없습니다." });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/clinic-locations
 * 새 개원자리 등록 (관리자용)
 */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body;

    const { data: location, error } = await supabase
      .from("clinic_locations")
      .insert([
        {
          title: body.title,
          address: body.address,
          region: body.region,
          type: body.type,
          size_sqm: body.size_sqm,
          floor: body.floor,
          monthly_rent: body.monthly_rent,
          deposit: body.deposit,
          parking_spaces: body.parking_spaces || 0,
          facilities: body.facilities || [],
          description: body.description,
          contact_phone: body.contact_phone,
          available_date: body.available_date,
          rating: body.rating || 0.0,
          images: body.images || [],
          latitude: body.latitude,
          longitude: body.longitude,
          is_active: body.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating clinic location:", error);
      return res.status(500).json({
        error: "Failed to create clinic location",
        details: error.message,
      });
    }

    res.json({
      success: true,
      data: location,
      message: "개원자리가 등록되었습니다.",
    });
  })
);

/**
 * PUT /api/clinic-locations/:id
 * 개원자리 수정
 */
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const body = req.body;

    const { data, error } = await supabase
      .from("clinic_locations")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/clinic-locations/:id/toggle
 * 개원자리 활성/비활성 토글
 */
router.post(
  "/:id/toggle",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // 현재 상태 조회
    const { data: current, error: fetchError } = await supabase
      .from("clinic_locations")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: "개원자리를 찾을 수 없습니다." });
    }

    // 상태 토글
    const { data, error } = await supabase
      .from("clinic_locations")
      .update({ is_active: !current.is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  })
);

/**
 * POST /api/clinic-location-favorites
 * 개원자리 즐겨찾기 추가/제거
 */
router.post(
  "/favorites",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { location_id, action } = req.body;

    if (!location_id || !action) {
      return res.status(400).json({ error: "필수 필드가 누락되었습니다." });
    }

    if (action === "add") {
      const { error } = await supabase.from("clinic_location_favorites").insert({
        user_id: user.id,
        location_id,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: "즐겨찾기에 추가되었습니다." });
    } else if (action === "remove") {
      const { error } = await supabase
        .from("clinic_location_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("location_id", location_id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: "즐겨찾기에서 제거되었습니다." });
    } else {
      res.status(400).json({ error: "올바른 action을 입력해주세요." });
    }
  })
);

export default router;

