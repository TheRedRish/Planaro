ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "preferences" jsonb DEFAULT '{
  "buffer_minutes": 5,
  "default_priority": "medium",
  "preferred_start_time": "08:00",
  "preferred_end_time": "20:00"
}'::jsonb;
