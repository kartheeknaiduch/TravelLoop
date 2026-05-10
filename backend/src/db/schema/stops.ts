import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tripsTable } from "./trips";
import { citiesTable } from "./cities";

export const stopsTable = pgTable("stops", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  cityId: integer("city_id").notNull().references(() => citiesTable.id, { onDelete: "restrict" }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  order: integer("order").notNull().default(0),
  notes: text("notes"),
});

export const insertStopSchema = createInsertSchema(stopsTable).omit({ id: true });
export type InsertStop = z.infer<typeof insertStopSchema>;
export type Stop = typeof stopsTable.$inferSelect;
