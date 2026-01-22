import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

// 환경변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4949;

// 미들웨어 설정
app.use(helmet()); // 보안 헤더
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // 로깅

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100 요청
  message: { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
});
app.use(limiter);

// 헬스 체크
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API 라우트
app.use("/api", routes);

// 404 처리
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;

