import { Router } from "express";
import { db } from "../db";
import { usersTable, tripsTable, citiesTable, activitiesTable } from "../db";
import { count, desc, gte } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [usersCount] = await db.select({ cnt: count() }).from(usersTable);
    const [tripsCount] = await db.select({ cnt: count() }).from(tripsTable);
    const [citiesCount] = await db.select({ cnt: count() }).from(citiesTable);
    const [activitiesCount] = await db.select({ cnt: count() }).from(activitiesTable);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [tripsThisMonth] = await db.select({ cnt: count() }).from(tripsTable).where(gte(tripsTable.createdAt, monthStart));

    const topCities = await db.select().from(citiesTable).orderBy(desc(citiesTable.popularity)).limit(10);
    const recentUsers = await db
      .select({
        id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName,
        email: usersTable.email, photo: usersTable.photo, phoneNumber: usersTable.phoneNumber,
        city: usersTable.city, country: usersTable.country, language: usersTable.language,
        isAdmin: usersTable.isAdmin, createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(10);

    res.json({
      totalUsers: Number(usersCount.cnt),
      totalTrips: Number(tripsCount.cnt),
      totalCities: Number(citiesCount.cnt),
      totalActivities: Number(activitiesCount.cnt),
      tripsThisMonth: Number(tripsThisMonth.cnt),
      topCities,
      recentUsers: recentUsers.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
