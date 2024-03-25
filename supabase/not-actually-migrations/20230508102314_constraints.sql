alter table "public"."messages" alter column "content" set data type character varying(6969) using "content"::character varying(6969);

alter table "public"."rooms" alter column "name" set data type character varying(64) using "name"::character varying(64);

CREATE UNIQUE INDEX profiles_unique_username ON public.profiles USING btree (username);

alter table "public"."profiles" add constraint "profiles_unique_username" UNIQUE using index "profiles_unique_username";


