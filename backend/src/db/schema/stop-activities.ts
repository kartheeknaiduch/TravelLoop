import { pgTable, serial, integer, text, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { stopsTable } from "./stops";
import { activitiesTable } from "./activities";

export const stopActivitiesTable = pgTable("stop_activities", {
  id: serial("id").primaryKey(),
  stopId: integer("stop_id").notNull().references(() => stopsTable.id, { onDelete: "cascade" }),
  activityId: integer("activity_id").notNull().references(() => activitiesTable.id, { onDelete: "cascade" }),
  date: text("date"),
  time: text("time"),
  cost: real("cost").notNull().default(0),
});

export const insertStopActivitySchema = createInsertSchema(stopActivitiesTable).omit({ id: true });
export type InsertStopActivity = z.infer<typeof insertStopActivitySchema>;
export type StopActivity = typeof stopActivitiesTable.$inferSelect;
