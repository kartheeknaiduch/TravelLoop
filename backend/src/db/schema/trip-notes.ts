import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tripsTable } from "./trips";
import { stopsTable } from "./stops";

export const tripNotesTable = pgTable("trip_notes", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  stopId: integer("stop_id").references(() => stopsTable.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTripNoteSchema = createInsertSchema(tripNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTripNote = z.infer<typeof insertTripNoteSchema>;
export type TripNote = typeof tripNotesTable.$inferSelect;
