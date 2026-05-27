CREATE TABLE IF NOT EXISTS "public"."routines" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "days_of_week" integer[] DEFAULT '{1,2,3,4,5,6,7}'::integer[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "routines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."routines" OWNER TO "postgres";

ALTER TABLE "public"."routines" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routines." ON "public"."routines" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can insert their own routines." ON "public"."routines" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can update their own routines." ON "public"."routines" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can delete their own routines." ON "public"."routines" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

GRANT ALL ON TABLE "public"."routines" TO "anon";
GRANT ALL ON TABLE "public"."routines" TO "authenticated";
GRANT ALL ON TABLE "public"."routines" TO "service_role";
