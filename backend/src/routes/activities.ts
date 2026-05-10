import { Router } from "express";
import { db } from "../db";
import { activitiesTable, citiesTable } from "../db";
import { eq, ilike, and, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { cityId, type, q, maxCost } = req.query as Record<string, string>;
    const conditions = [];
    if (cityId) conditions.push(eq(activitiesTable.cityId, parseInt(cityId)));
    if (type) conditions.push(eq(activitiesTable.type, type));
    if (q) conditions.push(ilike(activitiesTable.name, `%${q}%`));
    if (maxCost) conditions.push(lte(activitiesTable.cost, parseFloat(maxCost)));

    const rows = await db
      .select({
        id: activitiesTable.id,
        cityId: activitiesTable.cityId,
        cityName: citiesTable.name,
        name: activitiesTable.name,
        description: activitiesTable.description,
        type: activitiesTable.type,
        cost: activitiesTable.cost,
        duration: activitiesTable.duration,
        imageUrl: activitiesTable.imageUrl,
      })
      .from(activitiesTable)
      .leftJoin(citiesTable, eq(activitiesTable.cityId, citiesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
