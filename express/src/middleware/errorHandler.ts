import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  status?: number;
  details?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  const status = err.status || 500;
  const message = err.message || "서버 오류가 발생했습니다.";

  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === "development" ? err.details : undefined,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

