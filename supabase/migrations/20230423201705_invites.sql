create type "public"."member_join_state" as enum ('invited', 'joined');

alter table "public"."room_members" drop constraint "room_members_pkey";

drop index if exists "public"."room_members_pkey";

alter table "public"."room_members" add column "join_state" member_join_state not null default 'invited'::member_join_state;

alter table "public"."room_members" add column "session_key" text;

CREATE UNIQUE INDEX room_members_pkey ON public.room_members USING btree (room_id, member_id, join_state);

alter table "public"."room_members" add constraint "room_members_pkey" PRIMARY KEY using index "room_members_pkey";

create or replace view "public"."room_members_with_users" as  SELECT room_members.room_id,
    room_members.join_state,
    room_members.joined_at,
    users.email,
    users.id,
    profiles.username,
    profiles.avatar
   FROM ((room_members
     JOIN auth.users users ON ((room_members.member_id = users.id)))
     JOIN profiles ON ((users.id = profiles.id)));


create or replace view "public"."users_with_profiles" as  SELECT users.email,
    users.id,
    profiles.username,
    profiles.avatar
   FROM (profiles
     JOIN auth.users users ON ((profiles.id = users.id)));


create policy "Enable delete for users based on user_id"
on "public"."room_members"
as permissive
for update
to authenticated
using ((auth.uid() = member_id))
with check ((auth.uid() = member_id));


create policy "Members can invite other users"
on "public"."room_members"
as permissive
for insert
to authenticated
with check (is_member_of(auth.uid(), room_id));



