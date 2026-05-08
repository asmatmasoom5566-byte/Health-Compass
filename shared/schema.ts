import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";

// We'll define the shapes here for consistency, even though persistence is client-side.
// We keep a dummy table definition to satisfy backend infrastructure requirements if needed later.

export const causes = pgTable("causes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseRate: integer("base_rate").notNull(), // 0-100
  symptoms: jsonb("symptoms").$type<string[]>().notNull(),
  pathognomonicSymptoms: jsonb("pathognomonic_symptoms").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  cardinalSymptoms: jsonb("cardinal_symptoms").$type<string[]>().notNull().default(sql`'[]'::jsonb`), // Important Features for conditions
  // Course Type field removed per user request
  startDuration: integer("start_duration").notNull(), // Earliest possible time (MANDATORY)
  endDuration: integer("end_duration").notNull(), // Latest possible time (MANDATORY)
  durationUnit: text("duration_unit").notNull(), // hours, days, weeks, months, years (ONE ONLY, MANDATORY)
  durationRuleType: text("duration_rule_type").notNull(), // Hard / Soft (MANDATORY)
  fullReview: text("full_review"),
  treatment: text("treatment"),
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

// User Management Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  profession: text("profession").notNull(), // doctor, student, nurse, pharmacist, other
  country: text("country"),
  clinicHospital: text("clinic_hospital"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, suspended
  role: text("role").notNull().default("standard_member"), // admin, editor, reviewer, standard_member, read_only_member
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  type: text("type").notNull(), // email_verification, phone_verification, password_reset
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  email: text("email"), // Optional: bind to specific email
  phone: text("phone"), // Optional: bind to specific phone
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userStatusAudit = pgTable("user_status_audit", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  verificationTokens: many(verificationTokens),
  statusAudit: many(userStatusAudit),
  createdInviteCodes: many(inviteCodes),
}));

export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [verificationTokens.userId],
    references: [users.id],
  }),
}));

export const userStatusAuditRelations = relations(userStatusAudit, ({ one }) => ({
  user: one(users, {
    fields: [userStatusAudit.userId],
    references: [users.id],
  }),
  changedByUser: one(users, {
    fields: [userStatusAudit.changedBy],
    references: [users.id],
  }),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
  createdByUser: one(users, {
    fields: [inviteCodes.createdBy],
    references: [users.id],
  }),
}));

// Course Type removed per user request

// Duration Unit for conditions (ONE ONLY)
export const durationUnitSchema = z.enum(['hours', 'days', 'weeks', 'months', 'years']);
export type DurationUnit = z.infer<typeof durationUnitSchema>;

// Rule Type for filtering
export const ruleTypeSchema = z.enum(['soft', 'hard']);
export type RuleType = z.infer<typeof ruleTypeSchema>;

// Duration Entry for conditions (Start-End Duration Structure)
// Each condition MUST define Start Duration and End Duration (Min/Max Duration fields prohibited)
export const durationEntrySchema = z.object({
  durationType: z.string(), // Acute / Chronic / Relapse / Prolonged
  startDuration: z.number().min(0), // Earliest possible time (MANDATORY)
  endDuration: z.number().min(0), // Latest possible time (MANDATORY)
  unit: durationUnitSchema, // hours / days / weeks / months / years (ONE ONLY, MANDATORY)
  ruleType: ruleTypeSchema, // Hard / Soft (MANDATORY)
}).refine(data => data.startDuration <= data.endDuration, {
  message: "Start Duration must be less than or equal to End Duration",
  path: ["startDuration", "endDuration"]
});
// Legacy Duration Entry (for backward compatibility)
const legacyDurationEntrySchema = z.object({
  durationType: z.string(), // Acute / Chronic / Relapse / Prolonged
  minDuration: z.number().min(0), // Earliest possible time (LEGACY)
  maxDuration: z.number().min(0), // Latest possible time (LEGACY)
  unit: durationUnitSchema, // hours / days / weeks / months / years (ONE ONLY, MANDATORY)
  ruleType: ruleTypeSchema, // Hard / Soft (MANDATORY)
}).refine(data => data.minDuration <= data.maxDuration, {
  message: "Min Duration must be less than or equal to Max Duration",
  path: ["minDuration", "maxDuration"]
});

// Union type to support both old and new formats during transition
export const durationEntrySchemaUnion = z.union([durationEntrySchema, legacyDurationEntrySchema]);
// Duration Type for conditions
export const durationTypeSchema = z.enum(['Acute', 'Chronic', 'Relapse', 'Prolonged', 'General']);
export type DurationType = z.infer<typeof durationTypeSchema>;

export type DurationEntry = z.infer<typeof durationEntrySchemaUnion>;

// Unified Duration Criteria for conditions (Start-End Duration Structure)
// Each condition MUST define Start Duration and End Duration (Min/Max Duration fields prohibited)
export const durationCriteriaSchema = z.object({
  startDuration: z.number().min(0), // Earliest possible time (MANDATORY)
  endDuration: z.number().min(0), // Latest possible time (MANDATORY)
  unit: durationUnitSchema, // hours / days / weeks / months / years (ONE ONLY, MANDATORY)
  ruleType: ruleTypeSchema, // Hard / Soft (MANDATORY)
}).refine(data => data.startDuration <= data.endDuration, {
  message: "Start Duration must be less than or equal to End Duration",
  path: ["startDuration", "endDuration"]
});
export type DurationCriteria = z.infer<typeof durationCriteriaSchema>;

// Symptom Schema (with typical symptom name and optional meaning/description)
export const symptomSchema = z.object({
  typicalSymptom: z.string().min(1, "Typical symptom is required"),
  meaning: z.string().optional() // Symptom meaning/description
});

export type Symptom = z.infer<typeof symptomSchema>;

// Union type to support both legacy string format and new object format for supportive features
export const symptomSchemaUnion = z.union([z.string(), symptomSchema]);

export const causeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  symptoms: z.array(symptomSchemaUnion), // Supportive features can have synonyms
  pathognomonicSymptoms: z.array(z.string()).optional(),
  cardinalSymptoms: z.array(z.string()).optional(),
  exclusionFeatures: z.array(z.string()).optional(),
  riskFactors: z.array(z.string()).optional(),
  treatment: z.string().optional(),
  fullReview: z.string().optional(),

  baseRate: z.number().optional(), // Base rate for statistical purposes
  
  // First Age Field - Common Age Range (no rule type - always soft, +6% boost)
  commonAgeRule: z.object({
    min: z.number().optional(), // Common Min Age
    max: z.number().optional() // Common Max Age
  }).optional(),
  
  // Second Age Field - Final Age Range (new field)
  finalAgeRule: z.object({
    min: z.number().optional(), // Final Min Age
    max: z.number().optional(), // Final Max Age
    ruleType: ruleTypeSchema.optional() // "soft" or "hard"
  }).optional(),
  
  // Legacy: Keep for backward compatibility
  ageRule: z.object({
    min: z.number().optional(), // Minimum age
    max: z.number().optional(), // Maximum age
    ruleType: ruleTypeSchema.optional()
  }).optional(),
  
  sexRule: z.enum(['male', 'female', 'both']).optional(),
  
  // Female-to-Male Ratio for gender-based scoring adjustments
  femaleToMaleRatio: z.object({
    female: z.number().min(1).max(10).optional(), // Female boost percentage (1-10%)
    male: z.number().min(1).max(10).optional() // Male boost percentage (1-10%)
  }).optional(),
  
  // Course Type removed per user request
  
  // First Duration Field - Common Duration Range (renamed from durationCriteria)
  commonDurationCriteria: z.object({
    startDuration: z.number().min(0).optional(), // Common Min Duration
    endDuration: z.number().min(0).optional(), // Common Max Duration
    unit: durationUnitSchema.optional(), // hours / days / weeks / months / years
    ruleType: ruleTypeSchema.optional() // "soft" or "hard"
  }).optional(),
  
  // Second Duration Field - Final Duration Range (new field)
  finalDurationCriteria: z.object({
    startDuration: z.number().min(0).optional(), // Final Min Duration
    endDuration: z.number().min(0).optional(), // Final Max Duration
    unit: durationUnitSchema.optional(), // hours / days / weeks / months / years
    ruleType: ruleTypeSchema.optional() // "soft" or "hard"
  }).optional(),
  
  // Legacy: Keep for backward compatibility (mapped to start/end duration)
  durationCriteria: durationCriteriaSchema.optional(),
  
  // Legacy: Keep for backward compatibility (mapped to start/end duration)
  durationRule: z.object({
    start: z.number().optional(), // Maps to startDuration
    end: z.number().optional(), // Maps to endDuration
    min: z.number().optional(), // Legacy field - maps to startDuration
    max: z.number().optional(), // Legacy field - maps to endDuration
    unit: durationUnitSchema.optional(),
    ruleType: ruleTypeSchema.optional()
  }).optional(),
  
  // For backward compatibility during transition
  durationEntries: z.array(durationEntrySchemaUnion).optional(), // Legacy field - to be phased out
  
  symptomDetails: z.record(z.string(), z.string()).optional(), // Detailed information for each symptom
  
  // Prevalence field for disease frequency scoring adjustments
  prevalence: z.enum(['high', 'moderate', 'low']).optional().default('moderate'), // High (+5%), Moderate (+3%), Low (0%)
  
  labTests: z.array(z.object({
    testName: z.string().min(1, "Test name is required"),
    testDetails: z.string().optional()
  })).optional().default([]), // Lab tests required for diagnosing this condition
  
  painRegions: z.array(z.string()).optional(), // Body regions associated with pain for this condition
  painPattern: z.string().optional(), // Description of pain pattern (e.g., "radiating", "localized")
  safetyCritical: z.boolean().optional().default(false), // Flag for emergency, red-flag, or must-not-miss conditions
  lastEditTime: z.string().optional() // Clinical audit timestamp - set ONLY on manual clinical edits, preserved through export/import, used for sorting and display
});

export const patientDemographicsSchema = z.object({
  age: z.number().min(0).max(150),
  sex: z.enum(['Male', 'Female']),
  duration: z.number().min(0),
  durationUnit: z.enum(['hours', 'days', 'weeks', 'months', 'years'])
});

// Medicine Schema for Pharmacology Intelligence System
export const medicineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Medicine name is required"),
  drugClass: z.string().min(1, "Drug class is required"),
  mechanismOfAction: z.string().min(1, "Mechanism of action is required"),
  clinicalUses: z.array(z.string()).min(1, "At least one clinical use is required"),
  adverseEffects: z.array(z.string()).optional().default([]),
  contraindications: z.array(z.string()).optional().default([]),
  ageRules: z.object({
    min: z.number().min(0).max(150).optional(),
    max: z.number().min(0).max(150).optional(),
    avoidInNeonates: z.boolean().optional().default(false),
    avoidInElderly: z.boolean().optional().default(false),
    ruleType: ruleTypeSchema.optional().default('soft')
  }).optional(),
  sexRules: z.object({
    avoidInPregnancy: z.boolean().optional().default(false),
    cautionInBreastfeeding: z.boolean().optional().default(false),
    sexSpecificRisks: z.array(z.string()).optional().default([])
  }).optional().default({}),
  durationRules: z.enum(['acute', 'chronic', 'both']).optional(),
  symptomMatchRules: z.object({
    primarySymptoms: z.array(z.string()).min(1, "At least one primary symptom is required"),
    secondarySymptoms: z.array(z.string()).optional().default([]),
    inappropriateSymptoms: z.array(z.string()).optional().default([])
  }),
  clinicalUseDetails: z.array(z.object({
    useName: z.string(),
    details: z.string().optional()
  })).optional().default([]),
  medicineAdvantage: z.string().optional(),
  medicineDisadvantage: z.string().optional(),
  augmentingMedicines: z.string().optional(), // Keep for legacy backward compatibility
  simplifiedStructuredAugmentingMedicines: z.array(z.string()).min(1, "At least one augmenting medicine part is required").optional(),
  comparisonData: z.string().optional(), // Dedicated comparison data for this medicine
  teachingNotes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Medicine Evaluation Result Schema
export const medicineEvaluationSchema = z.object({
  medicine: medicineSchema,
  suitabilityScore: z.number().min(0).max(100),
  isSuitable: z.boolean(),
  isContraindicated: z.boolean(),
  reasoning: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
  safetyFlags: z.array(z.string()).optional()
});

export const pharmacologyDataSchema = z.object({
  medicines: z.array(medicineSchema),
  lastUpdated: z.string().optional()
});

export const appDataSchema = z.object({
  causes: z.array(causeSchema),
});

export type Cause = z.infer<typeof causeSchema>;
export type SymptomMatchType = 'pathognomonic' | 'defining' | 'typical' | 'none';
export type AppData = z.infer<typeof appDataSchema>;
export type Medicine = z.infer<typeof medicineSchema>;
export type MedicineEvaluation = z.infer<typeof medicineEvaluationSchema>;
export type PharmacologyData = z.infer<typeof pharmacologyDataSchema>;

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

// User Management Types
export type User = typeof users.$inferSelect;
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertVerificationToken = Omit<VerificationToken, 'id' | 'createdAt'>;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = Omit<InviteCode, 'id' | 'createdAt' | 'usedCount'>;
export type UserStatusAudit = typeof userStatusAudit.$inferSelect;

// User registration schema
export const userRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  profession: z.enum(['doctor', 'student', 'nurse', 'pharmacist', 'other'], {
    required_error: "Profession is required"
  }),
  country: z.string().optional(),
  clinicHospital: z.string().optional(),
  inviteCode: z.string().min(1, "Invite code is required"),
});

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  password: z.string().min(1, "Password is required"),
}).refine(data => {
  if (!data.email && !data.phone) {
    return {
      message: "Either email or phone number is required",
      path: ["email"]
    };
  }
  return true;
});

// User status update schema
export const userStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
  reason: z.string().optional(),
});

// User role update schema
export const userRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'editor', 'reviewer', 'standard_member', 'read_only_member']),
});

// Invite code creation schema
export const inviteCodeCreationSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  expiresAt: z.string().optional(),
  maxUses: z.number().min(1).max(100).optional().default(1),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  country: z.string().optional(),
  clinicHospital: z.string().optional(),
  profession: z.enum(['doctor', 'student', 'nurse', 'pharmacist', 'other']).optional(),
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export * from "./models/chat";
