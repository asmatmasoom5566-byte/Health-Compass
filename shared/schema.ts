import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// We'll define the shapes here for consistency, even though persistence is client-side.
// We keep a dummy table definition to satisfy backend infrastructure requirements if needed later.

export const causes = pgTable("causes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseRate: integer("base_rate").notNull(), // 0-100
  symptoms: jsonb("symptoms").$type<string[]>().notNull(),
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  symptoms: jsonb("symptoms").$type<string[]>().notNull(),
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Client-side specific schemas
export const causeSchema = z.object({
  id: z.string(), // Client-side UUID
  name: z.string().min(1, "Name is required"),
  symptoms: z.array(z.string()),
  note: z.string().optional(),
  treatment: z.string().optional()
});

export const appDataSchema = z.object({
  causes: z.array(causeSchema),
});

export type Cause = z.infer<typeof causeSchema>;
export type AppData = z.infer<typeof appDataSchema>;

// Drizzle schemas (unused but good for structure)
export const insertCauseSchema = createInsertSchema(causes);
export type InsertCause = z.infer<typeof insertCauseSchema>;
export type CauseItem = typeof causes.$inferSelect;

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  timestamp: true,
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

export * from "./models/chat";
