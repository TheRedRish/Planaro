ALTER TABLE "public"."tasks" 
ADD COLUMN IF NOT EXISTS "google_event_id" text,
ADD COLUMN IF NOT EXISTS "google_calendar_id" text;
