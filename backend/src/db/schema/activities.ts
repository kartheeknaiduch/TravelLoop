import { pgTable, serial, text, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable } from "./cities";

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => citiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("sightseeing"),
  cost: real("cost").notNull().default(0),
  duration: real("duration").notNull().default(2),
  imageUrl: text("image_url"),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({ id: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
