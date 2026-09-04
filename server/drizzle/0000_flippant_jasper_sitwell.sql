CREATE TABLE IF NOT EXISTS "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"mode" text,
	"route_via" text,
	"flow" text,
	"quote_fields" jsonb DEFAULT '{}'::jsonb,
	"content_fields" jsonb DEFAULT '{}'::jsonb,
	"ready_to_submit" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"ref_id" text NOT NULL,
	"heading" text,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"model" text NOT NULL,
	"dim" integer NOT NULL,
	"vector" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"flow" text NOT NULL,
	"fields" jsonb NOT NULL,
	"email" text NOT NULL,
	"email_status" text NOT NULL,
	"resend_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"turn_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"mode" text,
	"tool_calls" jsonb,
	"ui_payload" jsonb,
	"model" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"cost_usd" real,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_daily" (
	"day" text PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conv_session_idx" ON "conversations" USING btree ("session_id","updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "emb_kind_idx" ON "embeddings" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "msg_conv_idx" ON "messages" USING btree ("conversation_id","created_at");