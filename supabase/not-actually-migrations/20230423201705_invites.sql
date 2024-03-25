alter table "public"."room_members" add column "session_key" text;

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
