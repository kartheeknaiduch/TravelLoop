import { Router } from "express";
import { db } from "../db";
import { usersTable } from "../db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth.js";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, city, country } = req.body;
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      firstName, lastName, email, passwordHash,
      phoneNumber: phoneNumber ?? null,
      city: city ?? null,
      country: country ?? null,
    }).returning();
    const token = generateToken(user.id);
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() }, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing email or password" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id);
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, createdAt: safeUser.createdAt.toISOString() }, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, photo, phoneNumber, city, country, language } = req.body;
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (photo !== undefined) updates.photo = photo;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (language !== undefined) updates.language = language;
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!)).returning();
    const { passwordHash: _, ...safeUser } = user;
    res.json({ ...safeUser, createdAt: safeUser.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.userId!));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
