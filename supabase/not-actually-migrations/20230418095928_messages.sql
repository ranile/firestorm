CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

alter table "public"."messages"
    add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."messages"
    add constraint "messages_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users (id) ON DELETE CASCADE not valid;

alter table "public"."messages"
    validate constraint "messages_author_id_fkey";

alter table "public"."messages"
    add constraint "messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES rooms (id) not valid;

alter table "public"."messages"
    validate constraint "messages_room_id_fkey";

create policy "Users can read messages if room they are in the room"
    on "public"."messages"
    as permissive
    for select
    to public
    using ((auth.uid() IN (SELECT room_members.member_id
                           FROM room_members
                           WHERE (room_members.room_id = messages.room_id))));


create policy "Users can send messages if room they are in the room"
    on "public"."messages"
    as permissive
    for insert
    to public
    with check ((auth.uid() IN (SELECT room_members.member_id
                                FROM room_members
                                WHERE (room_members.room_id = messages.room_id))));


create policy "Users can update their own messages."
    on "public"."messages"
    as permissive
    for update
    to public
    using ((auth.uid() = author_id));

