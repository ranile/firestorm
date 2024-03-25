CREATE UNIQUE INDEX attachments_pkey ON public.attachments USING btree (id);

alter table "public"."attachments" add constraint "attachments_pkey" PRIMARY KEY using index "attachments_pkey";

alter table "public"."attachments" add constraint "attachments_id_fkey" FOREIGN KEY (id) REFERENCES storage.objects(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_id_fkey";

alter table "public"."attachments" add constraint "attachments_message_id_fkey" FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_message_id_fkey";

set check_function_bodies = off;

create or replace view "public"."attachments_and_objects" as  SELECT a.id AS attachment_id,
    a.message_id,
    a.name,
    a.type,
    a.key_ciphertext,
    a.hashes,
    o.id AS object_id,
    o.name AS path
   FROM (attachments a
     JOIN storage.objects o ON ((a.id = o.id)));


CREATE OR REPLACE FUNCTION public.insert_message(p_uid uuid, p_files jsonb, p_room_id uuid, p_ciphertext text, p_reply_to uuid default null)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    message_id        UUID;
    attachment_id     UUID;
    file_record       RECORD;
BEGIN
    -- Insert data into messages table
    INSERT INTO messages (content, room_id, author_id, reply_to)
    VALUES (p_ciphertext, p_room_id, p_uid, p_reply_to)
    RETURNING id INTO message_id;

    -- Iterate over files and insert data into attachments table
    FOR file_record IN SELECT *
                       FROM jsonb_to_recordset(p_files) AS x(
                                                             path TEXT,
                                                             name TEXT,
                                                             type TEXT,
                                                             key_ciphertext TEXT,
                                                             hashes JSONB
                           )
        LOOP
            attachment_id := (SELECT id
                              FROM storage.objects
                              WHERE name = file_record.path);
            -- Insert data into attachments table
            INSERT INTO attachments (id, name, type, key_ciphertext, hashes, message_id)
            VALUES (attachment_id, file_record.name, file_record.type, file_record.key_ciphertext, file_record.hashes,
                    message_id);
        END LOOP;
END;
$function$
;

create policy "Insert attachments for own messages"
on "public"."attachments"
as permissive
for insert
to public
with check (( WITH message_info AS (
         SELECT messages.room_id,
            messages.author_id
           FROM messages
          WHERE (messages.id = attachments.message_id)
        )
 SELECT (is_member_of(auth.uid(), message_info.room_id) AND (auth.uid() = message_info.author_id))
   FROM message_info));


create policy "room members can read attachments"
on "public"."attachments"
as permissive
for select
to authenticated
using (is_member_of(auth.uid(), ( SELECT messages.room_id
   FROM messages
  WHERE (messages.id = attachments.message_id))));



create policy "Attachments writes are allowed"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'attachments'::text));


create policy "Attachments reads are allowed"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'attachments'::text));



