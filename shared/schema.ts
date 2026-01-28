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

// For stateful symptom analysis
export const analysisSessions = pgTable("analysis_sessions", {
  id: serial("id").primaryKey(),
  initialSymptom: text("initial_symptom").notNull(),
  currentQuestion: text("current_question"),
  answers: jsonb("answers").$type<Array<{question: string, answer: boolean}>>().default([]),
  diagnosisScores: jsonb("diagnosis_scores").$type<Array<{name: string, score: number}>>().default([]),
  status: text("status").default("active").notNull(), // active, completed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const causeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  symptoms: z.array(z.string()),
  atypicalSymptoms: z.array(z.string()).optional(),
  details: z.string().optional(),
  labTest: z.string().optional(),
  note: z.string().optional(),
  treatment: z.string().optional()
});

export const appDataSchema = z.object({
  causes: z.array(causeSchema),
});

export type Cause = z.infer<typeof causeSchema>;
export type AppData = z.infer<typeof appDataSchema>;

export const insertAnalysisSessionSchema = createInsertSchema(analysisSessions).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  timestamp: true,
});

export type AnalysisSession = typeof analysisSessions.$inferSelect;
export type InsertAnalysisSession = z.infer<typeof insertAnalysisSessionSchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

export * from "./models/chat";
