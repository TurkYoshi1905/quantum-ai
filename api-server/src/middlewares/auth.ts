import type { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken, type JwtPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers["authorization"]);
  if (!token) {
    res.status(401).json({ error: "Kimlik doğrulama gerekli" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
    return;
  }
  req.user = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers["authorization"]);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}
