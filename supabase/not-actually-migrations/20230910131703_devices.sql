create extension if not exists "http" with schema "public" version '1.5';

alter table "public"."user_one_time_keys" drop constraint "user_one_time_keys_pkey";

drop index if exists "public"."user_one_time_keys_pkey";


alter table "public"."user_identity_keys" add column "device_id" uuid not null;

alter table "public"."user_one_time_keys" drop column "key_id";

CREATE UNIQUE INDEX user_devices_pkey ON public.user_devices USING btree (id, device_id);

alter table "public"."user_devices" add constraint "user_devices_pkey" PRIMARY KEY using index "user_devices_pkey";

alter table "public"."user_devices" add constraint "user_devices_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_devices" validate constraint "user_devices_id_fkey";

