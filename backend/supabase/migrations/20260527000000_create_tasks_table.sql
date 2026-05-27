CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer DEFAULT 30,
    "condition_tags" text[] DEFAULT '{}'::text[],
    "status" "text" DEFAULT 'staged'::text NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."tasks" OWNER TO "postgres";

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks." ON "public"."tasks" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can insert their own tasks." ON "public"."tasks" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can update their own tasks." ON "public"."tasks" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can delete their own tasks." ON "public"."tasks" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";
