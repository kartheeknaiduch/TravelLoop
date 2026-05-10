import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tripsTable } from "./trips";

export const checklistItemsTable = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  isPacked: boolean("is_packed").notNull().default(false),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItemsTable).omit({ id: true });
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItemsTable.$inferSelect;
