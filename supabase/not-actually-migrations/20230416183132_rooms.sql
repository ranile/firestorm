
alter table "public"."rooms" enable row level security;

CREATE UNIQUE INDEX room_members_pkey ON public.room_members USING btree (room_id, member_id);

CREATE UNIQUE INDEX rooms_pkey ON public.rooms USING btree (id);

alter table "public"."room_members" add constraint "room_members_pkey" PRIMARY KEY using index "room_members_pkey";

alter table "public"."rooms" add constraint "rooms_pkey" PRIMARY KEY using index "rooms_pkey";

alter table "public"."room_members" add constraint "room_members_member_id_fkey" FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."room_members" validate constraint "room_members_member_id_fkey";

alter table "public"."room_members" add constraint "room_members_room_id_fkey" FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE not valid;

alter table "public"."room_members" validate constraint "room_members_room_id_fkey";



create policy "users can read rooms members for rooms they are in"
on "public"."room_members"
as permissive
for select
to authenticated
using (is_member_of(auth.uid(), room_id));


create policy "users can read rooms for rooms they are in"
on "public"."rooms"
as permissive
for select
to authenticated
using (is_member_of(auth.uid(), id));



