import { Router } from "express";
import { db } from "../db";
import {
  tripsTable,
  stopsTable,
  citiesTable,
  stopActivitiesTable,
  activitiesTable,
  checklistItemsTable,
  tripNotesTable,
  usersTable,
} from "../db";
import { eq, and, count, sql, ne } from "drizzle-orm";
import { requireAuth, optionalAuth, AuthRequest } from "../middlewares/auth.js";
import { generateShareCode } from "../lib/auth.js";

const router = Router();

function getTripStatus(
  startDate: string,
  endDate: string,
): "upcoming" | "ongoing" | "completed" {
  const now = new Date().toISOString().slice(0, 10);
  if (now < startDate) return "upcoming";
  if (now > endDate) return "completed";
  return "ongoing";
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && endA >= startB;
}

async function buildTripWithStops(tripId: number) {
  const stops = await db
    .select({
      id: stopsTable.id,
      tripId: stopsTable.tripId,
      cityId: stopsTable.cityId,
      cityName: citiesTable.name,
      country: citiesTable.country,
      imageUrl: citiesTable.imageUrl,
      startDate: stopsTable.startDate,
      endDate: stopsTable.endDate,
      order: stopsTable.order,
      notes: stopsTable.notes,
    })
    .from(stopsTable)
    .leftJoin(citiesTable, eq(stopsTable.cityId, citiesTable.id))
    .where(eq(stopsTable.tripId, tripId))
    .orderBy(stopsTable.order);

  const stopsWithActivities = await Promise.all(
    stops.map(async (stop) => {
      const acts = await db
        .select({
          id: stopActivitiesTable.id,
          stopId: stopActivitiesTable.stopId,
          activityId: stopActivitiesTable.activityId,
          name: activitiesTable.name,
          type: activitiesTable.type,
          date: stopActivitiesTable.date,
          time: stopActivitiesTable.time,
          cost: stopActivitiesTable.cost,
          duration: activitiesTable.duration,
          imageUrl: activitiesTable.imageUrl,
        })
        .from(stopActivitiesTable)
        .leftJoin(
          activitiesTable,
          eq(stopActivitiesTable.activityId, activitiesTable.id),
        )
        .where(eq(stopActivitiesTable.stopId, stop.id));
      return { ...stop, activities: acts };
    }),
  );

  return stopsWithActivities;
}

// List trips
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query as { status?: string };
    const trips = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.userId, req.userId!));

    const stopCounts = await db
      .select({ tripId: stopsTable.tripId, cnt: count() })
      .from(stopsTable)
      .groupBy(stopsTable.tripId);

    const countMap = Object.fromEntries(
      stopCounts.map((r) => [r.tripId, Number(r.cnt)]),
    );

    const result = trips
      .map((t) => ({
        ...t,
        startDate: t.startDate,
        endDate: t.endDate,
        status: getTripStatus(t.startDate, t.endDate),
        stopCount: countMap[t.id] ?? 0,
        createdAt: t.createdAt.toISOString(),
      }))
      .filter((t) => !status || t.status === status);

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create trip
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      startDate,
      endDate,
      description,
      coverPhoto,
      isPublic,
      totalBudget,
    } = req.body;
    if (!name || !startDate || !endDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (endDate < startDate) {
      res
        .status(400)
        .json({ error: "End date must be on or after start date" });
      return;
    }
    const todayISO = new Date().toISOString().slice(0, 10);
    if (startDate < todayISO || endDate < todayISO) {
      res.status(400).json({ error: "Trip dates cannot be in the past" });
      return;
    }
    const shareCode = isPublic ? generateShareCode() : null;
    const [trip] = await db
      .insert(tripsTable)
      .values({
        userId: req.userId!,
        name,
        startDate,
        endDate,
        description: description ?? null,
        coverPhoto: coverPhoto ?? null,
        isPublic: isPublic ?? false,
        shareCode,
        totalBudget: totalBudget ?? null,
      })
      .returning();
    res.status(201).json({
      ...trip,
      status: getTripStatus(trip.startDate, trip.endDate),
      stopCount: 0,
      createdAt: trip.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get trip
router.get("/:tripId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const stops = await buildTripWithStops(tripId);
    res.json({
      ...trip,
      status: getTripStatus(trip.startDate, trip.endDate),
      stopCount: stops.length,
      stops,
      createdAt: trip.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update trip
router.put("/:tripId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const {
      name,
      startDate,
      endDate,
      description,
      coverPhoto,
      isPublic,
      totalBudget,
    } = req.body;

    if (startDate !== undefined || endDate !== undefined) {
      const nextStart = startDate ?? trip.startDate;
      const nextEnd = endDate ?? trip.endDate;
      if (nextEnd < nextStart) {
        res
          .status(400)
          .json({ error: "End date must be on or after start date" });
        return;
      }
      const todayISO = new Date().toISOString().slice(0, 10);
      if (nextStart < todayISO || nextEnd < todayISO) {
        res.status(400).json({ error: "Trip dates cannot be in the past" });
        return;
      }
    }

    const updates: Partial<typeof tripsTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (description !== undefined) updates.description = description;
    if (coverPhoto !== undefined) updates.coverPhoto = coverPhoto;
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
      if (isPublic && !trip.shareCode) updates.shareCode = generateShareCode();
    }
    if (totalBudget !== undefined) updates.totalBudget = totalBudget;
    const [updated] = await db
      .update(tripsTable)
      .set(updates)
      .where(eq(tripsTable.id, tripId))
      .returning();
    const stopCnt = await db
      .select({ cnt: count() })
      .from(stopsTable)
      .where(eq(stopsTable.tripId, tripId));
    res.json({
      ...updated,
      status: getTripStatus(updated.startDate, updated.endDate),
      stopCount: Number(stopCnt[0]?.cnt ?? 0),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete trip
router.delete("/:tripId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    await db.delete(tripsTable).where(eq(tripsTable.id, tripId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get budget
router.get("/:tripId/budget", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    const stops = await db
      .select()
      .from(stopsTable)
      .where(eq(stopsTable.tripId, tripId));
    let activitiesTotal = 0;
    for (const stop of stops) {
      const acts = await db
        .select({ cost: stopActivitiesTable.cost })
        .from(stopActivitiesTable)
        .where(eq(stopActivitiesTable.stopId, stop.id));
      activitiesTotal += acts.reduce((s, a) => s + (a.cost ?? 0), 0);
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000),
    );
    const transport = stops.length > 1 ? stops.length * 80 : 0;
    const accommodation = days * 120;
    const meals = days * 40;
    const total = transport + accommodation + activitiesTotal + meals;
    const plannedBudget = trip.totalBudget ?? null;

    res.json({
      tripId,
      transport,
      accommodation,
      activities: activitiesTotal,
      meals,
      other: 0,
      total,
      avgPerDay: total / days,
      days,
      plannedBudget,
      isOverBudget: plannedBudget !== null ? total > plannedBudget : false,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Stops ---

router.get("/:tripId/stops", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const stops = await buildTripWithStops(tripId);
    res.json(stops);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:tripId/stops", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const { cityId, startDate, endDate, order, notes } = req.body;
    if (!startDate || !endDate) {
      res.status(400).json({ error: "Missing required dates" });
      return;
    }
    if (endDate < startDate) {
      res
        .status(400)
        .json({ error: "End date must be on or after start date" });
      return;
    }
    const todayISO = new Date().toISOString().slice(0, 10);
    if (startDate < todayISO || endDate < todayISO) {
      res.status(400).json({ error: "Stop dates cannot be in the past" });
      return;
    }
    if (
      !isDateInRange(startDate, trip.startDate, trip.endDate) ||
      !isDateInRange(endDate, trip.startDate, trip.endDate)
    ) {
      res.status(400).json({ error: "Stop dates must be within trip dates" });
      return;
    }
    const existingStops = await db
      .select({
        id: stopsTable.id,
        startDate: stopsTable.startDate,
        endDate: stopsTable.endDate,
      })
      .from(stopsTable)
      .where(eq(stopsTable.tripId, tripId));
    if (
      existingStops.some((stop) =>
        rangesOverlap(startDate, endDate, stop.startDate, stop.endDate),
      )
    ) {
      res
        .status(400)
        .json({ error: "Stop dates overlap with an existing stop" });
      return;
    }
    const [city] = await db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.id, cityId))
      .limit(1);
    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }
    const [stop] = await db
      .insert(stopsTable)
      .values({
        tripId,
        cityId,
        startDate,
        endDate,
        order: order ?? 0,
        notes: notes ?? null,
      })
      .returning();
    res.status(201).json({
      ...stop,
      cityName: city.name,
      country: city.country,
      imageUrl: city.imageUrl,
      activities: [],
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put(
  "/:tripId/stops/:stopId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const stopId = parseInt(req.params.stopId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      const [currentStop] = await db
        .select({
          id: stopsTable.id,
          startDate: stopsTable.startDate,
          endDate: stopsTable.endDate,
        })
        .from(stopsTable)
        .where(and(eq(stopsTable.id, stopId), eq(stopsTable.tripId, tripId)))
        .limit(1);
      if (!currentStop) {
        res.status(404).json({ error: "Stop not found" });
        return;
      }
      const { startDate, endDate, order, notes } = req.body;
      const updates: Partial<typeof stopsTable.$inferInsert> = {};
      if (startDate !== undefined) updates.startDate = startDate;
      if (endDate !== undefined) updates.endDate = endDate;
      if (order !== undefined) updates.order = order;
      if (notes !== undefined) updates.notes = notes;

      const nextStart = updates.startDate ?? currentStop.startDate;
      const nextEnd = updates.endDate ?? currentStop.endDate;
      if (nextStart && nextEnd && nextEnd < nextStart) {
        res
          .status(400)
          .json({ error: "End date must be on or after start date" });
        return;
      }
      const todayISO = new Date().toISOString().slice(0, 10);
      if (
        (nextStart && nextStart < todayISO) ||
        (nextEnd && nextEnd < todayISO)
      ) {
        res.status(400).json({ error: "Stop dates cannot be in the past" });
        return;
      }
      if (
        nextStart &&
        !isDateInRange(nextStart, trip.startDate, trip.endDate)
      ) {
        res.status(400).json({ error: "Stop dates must be within trip dates" });
        return;
      }
      if (nextEnd && !isDateInRange(nextEnd, trip.startDate, trip.endDate)) {
        res.status(400).json({ error: "Stop dates must be within trip dates" });
        return;
      }
      const otherStops = await db
        .select({
          id: stopsTable.id,
          startDate: stopsTable.startDate,
          endDate: stopsTable.endDate,
        })
        .from(stopsTable)
        .where(and(eq(stopsTable.tripId, tripId), ne(stopsTable.id, stopId)));
      if (
        otherStops.some((stop) =>
          rangesOverlap(nextStart, nextEnd, stop.startDate, stop.endDate),
        )
      ) {
        res
          .status(400)
          .json({ error: "Stop dates overlap with an existing stop" });
        return;
      }
      const [stop] = await db
        .update(stopsTable)
        .set(updates)
        .where(and(eq(stopsTable.id, stopId), eq(stopsTable.tripId, tripId)))
        .returning();
      if (!stop) {
        res.status(404).json({ error: "Stop not found" });
        return;
      }
      const [city] = await db
        .select()
        .from(citiesTable)
        .where(eq(citiesTable.id, stop.cityId))
        .limit(1);
      res.json({
        ...stop,
        cityName: city?.name ?? "",
        country: city?.country ?? "",
        imageUrl: city?.imageUrl ?? null,
        activities: [],
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:tripId/stops/:stopId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const stopId = parseInt(req.params.stopId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      await db
        .delete(stopsTable)
        .where(and(eq(stopsTable.id, stopId), eq(stopsTable.tripId, tripId)));
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// --- Stop Activities ---

router.get(
  "/:tripId/stops/:stopId/activities",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const stopId = parseInt(req.params.stopId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      const acts = await db
        .select({
          id: stopActivitiesTable.id,
          stopId: stopActivitiesTable.stopId,
          activityId: stopActivitiesTable.activityId,
          name: activitiesTable.name,
          type: activitiesTable.type,
          date: stopActivitiesTable.date,
          time: stopActivitiesTable.time,
          cost: stopActivitiesTable.cost,
          duration: activitiesTable.duration,
          imageUrl: activitiesTable.imageUrl,
        })
        .from(stopActivitiesTable)
        .leftJoin(
          activitiesTable,
          eq(stopActivitiesTable.activityId, activitiesTable.id),
        )
        .where(eq(stopActivitiesTable.stopId, stopId));
      res.json(acts);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/:tripId/stops/:stopId/activities",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const stopId = parseInt(req.params.stopId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      const { activityId, date, time, cost } = req.body;
      const [activity] = await db
        .select()
        .from(activitiesTable)
        .where(eq(activitiesTable.id, activityId))
        .limit(1);
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }
      const [sa] = await db
        .insert(stopActivitiesTable)
        .values({
          stopId,
          activityId,
          date: date ?? null,
          time: time ?? null,
          cost: cost ?? activity.cost,
        })
        .returning();
      res.status(201).json({
        ...sa,
        name: activity.name,
        type: activity.type,
        duration: activity.duration,
        imageUrl: activity.imageUrl,
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:tripId/stops/:stopId/activities/:activityId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const stopId = parseInt(req.params.stopId as string);
      const activityId = parseInt(req.params.activityId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      await db
        .delete(stopActivitiesTable)
        .where(
          and(
            eq(stopActivitiesTable.id, activityId),
            eq(stopActivitiesTable.stopId, stopId),
          ),
        );
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// --- Checklist ---

router.get("/:tripId/checklist", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const items = await db
      .select()
      .from(checklistItemsTable)
      .where(eq(checklistItemsTable.tripId, tripId));
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/:tripId/checklist",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      const { name, category } = req.body;
      const [item] = await db
        .insert(checklistItemsTable)
        .values({
          tripId,
          name,
          category: category ?? "other",
          isPacked: false,
        })
        .returning();
      res.status(201).json(item);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.put(
  "/:tripId/checklist/:itemId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const itemId = parseInt(req.params.itemId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      const { name, category, isPacked } = req.body;
      const updates: Partial<typeof checklistItemsTable.$inferInsert> = {};
      if (name !== undefined) updates.name = name;
      if (category !== undefined) updates.category = category;
      if (isPacked !== undefined) updates.isPacked = isPacked;
      const [item] = await db
        .update(checklistItemsTable)
        .set(updates)
        .where(
          and(
            eq(checklistItemsTable.id, itemId),
            eq(checklistItemsTable.tripId, tripId),
          ),
        )
        .returning();
      res.json(item);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:tripId/checklist/:itemId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const itemId = parseInt(req.params.itemId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      await db
        .delete(checklistItemsTable)
        .where(
          and(
            eq(checklistItemsTable.id, itemId),
            eq(checklistItemsTable.tripId, tripId),
          ),
        );
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// --- Notes ---

router.get("/:tripId/notes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const notes = await db
      .select({
        id: tripNotesTable.id,
        tripId: tripNotesTable.tripId,
        stopId: tripNotesTable.stopId,
        stopName: citiesTable.name,
        content: tripNotesTable.content,
        createdAt: tripNotesTable.createdAt,
        updatedAt: tripNotesTable.updatedAt,
      })
      .from(tripNotesTable)
      .leftJoin(stopsTable, eq(tripNotesTable.stopId, stopsTable.id))
      .leftJoin(citiesTable, eq(stopsTable.cityId, citiesTable.id))
      .where(eq(tripNotesTable.tripId, tripId))
      .orderBy(tripNotesTable.createdAt);
    res.json(
      notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:tripId/notes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tripId = parseInt(req.params.tripId as string);
    const [trip] = await db
      .select()
      .from(tripsTable)
      .where(eq(tripsTable.id, tripId))
      .limit(1);
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    const { content, stopId } = req.body;
    const [note] = await db
      .insert(tripNotesTable)
      .values({ tripId, content, stopId: stopId ?? null })
      .returning();
    res.status(201).json({
      ...note,
      stopName: null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put(
  "/:tripId/notes/:noteId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const noteId = parseInt(req.params.noteId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      const { content, stopId } = req.body;
      const updates: Partial<typeof tripNotesTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (content !== undefined) updates.content = content;
      if (stopId !== undefined) updates.stopId = stopId;
      const [note] = await db
        .update(tripNotesTable)
        .set(updates)
        .where(
          and(eq(tripNotesTable.id, noteId), eq(tripNotesTable.tripId, tripId)),
        )
        .returning();
      res.json({
        ...note,
        stopName: null,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/:tripId/notes/:noteId",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const tripId = parseInt(req.params.tripId as string);
      const noteId = parseInt(req.params.noteId as string);
      const [trip] = await db
        .select()
        .from(tripsTable)
        .where(eq(tripsTable.id, tripId))
        .limit(1);
      if (!trip || trip.userId !== req.userId) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      await db
        .delete(tripNotesTable)
        .where(
          and(eq(tripNotesTable.id, noteId), eq(tripNotesTable.tripId, tripId)),
        );
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
