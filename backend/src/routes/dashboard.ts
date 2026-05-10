import { Router } from "express";
import { db } from "../db";
import { tripsTable, stopsTable, citiesTable } from "../db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

function getTripStatus(startDate: string, endDate: string): "upcoming" | "ongoing" | "completed" {
  const now = new Date().toISOString().slice(0, 10);
  if (now < startDate) return "upcoming";
  if (now > endDate) return "completed";
  return "ongoing";
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const trips = await db.select().from(tripsTable).where(eq(tripsTable.userId, userId));

    const stopCounts = await db
      .select({ tripId: stopsTable.tripId, cnt: count() })
      .from(stopsTable)
      .groupBy(stopsTable.tripId);
    const countMap = Object.fromEntries(stopCounts.map(r => [r.tripId, Number(r.cnt)]));

    const tripsWithStatus = trips.map(t => ({
      ...t,
      status: getTripStatus(t.startDate, t.endDate),
      stopCount: countMap[t.id] ?? 0,
      createdAt: t.createdAt.toISOString(),
    }));

    const totalTrips = trips.length;
    const upcomingTrips = tripsWithStatus.filter(t => t.status === "upcoming").length;
    const ongoingTrips = tripsWithStatus.filter(t => t.status === "ongoing").length;
    const completedTrips = tripsWithStatus.filter(t => t.status === "completed").length;

    const allStops = await db.select({ cityId: stopsTable.cityId, tripId: stopsTable.tripId })
      .from(stopsTable)
      .leftJoin(tripsTable, eq(stopsTable.tripId, tripsTable.id))
      .where(eq(tripsTable.userId, userId));
    const uniqueCities = new Set(allStops.map(s => s.cityId));

    const recentTrips = tripsWithStatus
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const recommendedCities = await db.select().from(citiesTable).orderBy(desc(citiesTable.popularity)).limit(8);

    const totalBudgetPlanned = trips.reduce((s, t) => s + (t.totalBudget ?? 0), 0);

    res.json({
      totalTrips,
      upcomingTrips,
      ongoingTrips,
      completedTrips,
      totalCitiesVisited: uniqueCities.size,
      totalBudgetPlanned,
      recentTrips,
      recommendedCities,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
