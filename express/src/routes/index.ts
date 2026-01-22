import { Router } from "express";

import vendorsRouter from "./vendors.js";
import categoriesRouter from "./categories.js";
import seminarsRouter from "./seminars.js";
import societiesRouter from "./societies.js";
import qnaRouter from "./qna.js";
import jobPostsRouter from "./jobPosts.js";
import beautyProductsRouter from "./beautyProducts.js";
import clinicLocationsRouter from "./clinicLocations.js";
import regionsRouter from "./regions.js";
import webinarRouter from "./webinar.js";

const router = Router();

// 업체 관련
router.use("/vendors", vendorsRouter);
router.use("/categories", categoriesRouter);
router.use("/vendor-search", vendorsRouter);

// 세미나/학회 관련
router.use("/seminars", seminarsRouter);
router.use("/societies", societiesRouter);

// Q&A
router.use("/qna", qnaRouter);

// 구인/구직
router.use("/job-posts", jobPostsRouter);
router.use("/my-job-posts", jobPostsRouter);

// 뷰티 제품
router.use("/beauty-products", beautyProductsRouter);

// 클리닉
router.use("/clinic-locations", clinicLocationsRouter);
router.use("/clinic-location-favorites", clinicLocationsRouter);

// 지역
router.use("/regions", regionsRouter);

// 웨비나
router.use("/webinar", webinarRouter);

export default router;

