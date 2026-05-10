import { Router } from "express";
import { db } from "../db";
import { citiesTable, activitiesTable } from "../db";
import { eq, ilike, and, or } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { q, country, region } = req.query as Record<string, string>;
    const conditions = [];
    if (q) conditions.push(ilike(citiesTable.name, `%${q}%`));
    if (country) conditions.push(ilike(citiesTable.country, `%${country}%`));
    if (region) conditions.push(ilike(citiesTable.region, `%${region}%`));
    const cities = conditions.length > 0
      ? await db.select().from(citiesTable).where(and(...conditions))
      : await db.select().from(citiesTable);
    res.json(cities);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:cityId", async (req, res) => {
  try {
    const cityId = parseInt(req.params.cityId as string);
    const [city] = await db.select().from(citiesTable).where(eq(citiesTable.id, cityId)).limit(1);
    if (!city) { res.status(404).json({ error: "City not found" }); return; }
    const activities = await db.select().from(activitiesTable).where(eq(activitiesTable.cityId, cityId));
    res.json({ ...city, activities: activities.map(a => ({ ...a, cityName: city.name })) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
