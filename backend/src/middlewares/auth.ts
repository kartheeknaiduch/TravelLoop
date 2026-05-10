import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { usersTable } from "../db";
import { eq } from "drizzle-orm";
import { parseToken } from "../lib/auth.js";

export interface AuthRequest extends Request {
  userId?: number;
  user?: typeof usersTable.$inferSelect;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = parseToken(token);
  if (!userId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.userId = userId;
  req.user = user;
  next();
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = parseToken(token);
    if (userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (user) {
        req.userId = userId;
        req.user = user;
      }
    }
  }
  next();
}
