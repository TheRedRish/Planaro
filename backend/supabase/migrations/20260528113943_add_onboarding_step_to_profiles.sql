ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "onboarding_step" text DEFAULT 'permission_transparency';
