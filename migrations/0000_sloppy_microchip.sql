CREATE TABLE "analysis_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"initial_symptom" text NOT NULL,
	"current_question" text,
	"answers" jsonb DEFAULT '[]'::jsonb,
	"diagnosis_scores" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "causes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_rate" integer NOT NULL,
	"symptoms" jsonb NOT NULL,
	"defining_symptoms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_duration" integer NOT NULL,
	"end_duration" integer NOT NULL,
	"duration_unit" text NOT NULL,
	"duration_rule_type" text NOT NULL,
	"full_review" text,
	"treatment" text
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"symptoms" jsonb NOT NULL,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;