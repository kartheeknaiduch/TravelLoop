import { pgTable, serial, text, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  costIndex: real("cost_index").notNull().default(50),
  popularity: integer("popularity").notNull().default(50),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true });
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof citiesTable.$inferSelect;
