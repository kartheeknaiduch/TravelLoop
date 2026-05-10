import { pgTable, serial, text, boolean, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  description: text("description"),
  coverPhoto: text("cover_photo"),
  isPublic: boolean("is_public").notNull().default(false),
  shareCode: text("share_code").unique(),
  totalBudget: real("total_budget"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
