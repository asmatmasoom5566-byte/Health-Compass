import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll define the shapes here for consistency, even though persistence is client-side.
// We keep a dummy table definition to satisfy backend infrastructure requirements if needed later.

export const causes = pgTable("causes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseRate: integer("base_rate").notNull(), // 0-100
  symptoms: jsonb("symptoms").$type<string[]>().notNull(),
});

// Client-side specific schemas
export const causeSchema = z.object({
  id: z.string(), // Client-side UUID
  name: z.string().min(1, "Name is required"),
  baseRate: z.number().min(0).max(100),
  symptoms: z.array(z.string()),
  note: z.string().optional()
});

export const appDataSchema = z.object({
  causes: z.array(causeSchema),
  history: z.array(z.any()) // For undo stack, simplified
});

export type Cause = z.infer<typeof causeSchema>;
export type AppData = z.infer<typeof appDataSchema>;

// Drizzle schemas (unused but good for structure)
export const insertCauseSchema = createInsertSchema(causes);
export type InsertCause = z.infer<typeof insertCauseSchema>;
export type CauseItem = typeof causes.$inferSelect;
