create table "public"."user_identity_keys" (
    "id" uuid not null,
    "identity_key" text not null
);


alter table "public"."user_identity_keys" enable row level security;

create table "public"."user_one_time_keys" (
    "id" uuid not null,
    "one_time_key" text not null
);


alter table "public"."user_one_time_keys" enable row level security;

alter table "public"."messages" enable row level security;

alter table "public"."rooms" add column "created_by" uuid;

CREATE UNIQUE INDEX user_identity_keys_pkey ON public.user_identity_keys USING btree (id);

CREATE UNIQUE INDEX user_one_time_keys_pkey ON public.user_one_time_keys USING btree (one_time_key, id);

alter table "public"."user_identity_keys" add constraint "user_identity_keys_pkey" PRIMARY KEY using index "user_identity_keys_pkey";

alter table "public"."user_one_time_keys" add constraint "user_one_time_keys_pkey" PRIMARY KEY using index "user_one_time_keys_pkey";

alter table "public"."rooms" add constraint "rooms_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."rooms" validate constraint "rooms_created_by_fkey";

alter table "public"."user_identity_keys" add constraint "user_identity_keys_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_identity_keys" validate constraint "user_identity_keys_id_fkey";

alter table "public"."user_one_time_keys" add constraint "user_one_time_keys_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_one_time_keys" validate constraint "user_one_time_keys_id_fkey";

create policy "Enable read access for all users"
on "public"."room_members"
as permissive
for select
to authenticated
using ((auth.uid() = member_id));


create policy "Users can join rooms they created"
on "public"."room_members"
as permissive
for insert
to public
with check (((auth.uid() = member_id) AND (auth.uid() IN ( SELECT rooms.created_by
   FROM rooms
  WHERE (rooms.id = room_members.room_id)))));


create policy "Enable insert for authenticated users only"
on "public"."rooms"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."rooms"
as permissive
for select
to authenticated
using ((auth.uid() = created_by));



