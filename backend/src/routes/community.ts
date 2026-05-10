import { Router } from "express";
import { db } from "../db";
import { tripsTable, stopsTable, citiesTable, usersTable, stopActivitiesTable, activitiesTable } from "../db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, optionalAuth, AuthRequest } from "../middlewares/auth.js";
import { generateShareCode } from "../lib/auth.js";

const router = Router();

function getTripStatus(startDate: string, endDate: string): "upcoming" | "ongoing" | "completed" {
  const now = new Date().toISOString().slice(0, 10);
  if (now < startDate) return "upcoming";
  if (now > endDate) return "completed";
  return "ongoing";
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: tripsTable.id,
        name: tripsTable.name,
        startDate: tripsTable.startDate,
        endDate: tripsTable.endDate,
        description: tripsTable.description,
        coverPhoto: tripsTable.coverPhoto,
        shareCode: tripsTable.shareCode,
        totalBudget: tripsTable.totalBudget,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(tripsTable)
      .leftJoin(usersTable, eq(tripsTable.userId, usersTable.id))
      .where(eq(tripsTable.isPublic, true));

    const stopCounts = await db.select({ tripId: stopsTable.tripId, cnt: count() }).from(stopsTable).groupBy(stopsTable.tripId);
    const countMap = Object.fromEntries(stopCounts.map(r => [r.tripId, Number(r.cnt)]));

    res.json(rows.map(t => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      description: t.description,
      coverPhoto: t.coverPhoto,
      shareCode: t.shareCode!,
      stopCount: countMap[t.id] ?? 0,
      totalBudget: t.totalBudget,
      authorName: `${t.firstName} ${t.lastName}`,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:shareCode", async (req, res) => {
  try {
    const shareCode = req.params.shareCode as string;
    const [trip] = await db.select().from(tripsTable).where(and(eq(tripsTable.shareCode, shareCode), eq(tripsTable.isPublic, true))).limit(1);
    if (!trip) { res.status(404).json({ error: "Not found" }); return; }

    const stops = await db
      .select({
        id: stopsTable.id, tripId: stopsTable.tripId, cityId: stopsTable.cityId,
        cityName: citiesTable.name, country: citiesTable.country, imageUrl: citiesTable.imageUrl,
        startDate: stopsTable.startDate, endDate: stopsTable.endDate, order: stopsTable.order, notes: stopsTable.notes,
      })
      .from(stopsTable)
      .leftJoin(citiesTable, eq(stopsTable.cityId, citiesTable.id))
      .where(eq(stopsTable.tripId, trip.id))
      .orderBy(stopsTable.order);

    const stopsWithActivities = await Promise.all(stops.map(async (stop) => {
      const acts = await db
        .select({
          id: stopActivitiesTable.id, stopId: stopActivitiesTable.stopId, activityId: stopActivitiesTable.activityId,
          name: activitiesTable.name, type: activitiesTable.type, date: stopActivitiesTable.date,
          time: stopActivitiesTable.time, cost: stopActivitiesTable.cost, duration: activitiesTable.duration, imageUrl: activitiesTable.imageUrl,
        })
        .from(stopActivitiesTable)
        .leftJoin(activitiesTable, eq(stopActivitiesTable.activityId, activitiesTable.id))
        .where(eq(stopActivitiesTable.stopId, stop.id));
      return { ...stop, activities: acts };
    }));

    res.json({
      ...trip,
      status: getTripStatus(trip.startDate, trip.endDate),
      stopCount: stops.length,
      stops: stopsWithActivities,
      createdAt: trip.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:shareCode/copy", requireAuth, async (req: AuthRequest, res) => {
  try {
    const shareCode = req.params.shareCode as string;
    const [original] = await db.select().from(tripsTable).where(and(eq(tripsTable.shareCode, shareCode), eq(tripsTable.isPublic, true))).limit(1);
    if (!original) { res.status(404).json({ error: "Not found" }); return; }

    const [newTrip] = await db.insert(tripsTable).values({
      userId: req.userId!,
      name: `Copy of ${original.name}`,
      startDate: original.startDate,
      endDate: original.endDate,
      description: original.description,
      coverPhoto: original.coverPhoto,
      isPublic: false,
      shareCode: null,
      totalBudget: original.totalBudget,
    }).returning();

    const stops = await db.select().from(stopsTable).where(eq(stopsTable.tripId, original.id));
    for (const stop of stops) {
      const [newStop] = await db.insert(stopsTable).values({ tripId: newTrip.id, cityId: stop.cityId, startDate: stop.startDate, endDate: stop.endDate, order: stop.order, notes: stop.notes }).returning();
      const acts = await db.select().from(stopActivitiesTable).where(eq(stopActivitiesTable.stopId, stop.id));
      for (const act of acts) {
        await db.insert(stopActivitiesTable).values({ stopId: newStop.id, activityId: act.activityId, date: act.date, time: act.time, cost: act.cost });
      }
    }

    const stopCnt = await db.select({ cnt: count() }).from(stopsTable).where(eq(stopsTable.tripId, newTrip.id));
    res.status(201).json({
      ...newTrip,
      status: getTripStatus(newTrip.startDate, newTrip.endDate),
      stopCount: Number(stopCnt[0]?.cnt ?? 0),
      createdAt: newTrip.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
