alter table "public"."user_one_time_keys"
    drop constraint "user_one_time_keys_pkey";

drop index if exists "public"."user_one_time_keys_pkey";

alter table "public"."user_identity_keys"
    drop column "identity_key";

alter table "public"."user_identity_keys"
    add column "curve25519" text not null;

alter table "public"."user_identity_keys"
    add column "ed25519" text not null;

alter table "public"."user_one_time_keys"
    drop column "one_time_key";

alter table "public"."user_one_time_keys"
    add column "curve25519" text not null;

alter table "public"."user_one_time_keys"
    add column "key_id" text not null;

CREATE UNIQUE INDEX user_one_time_keys_pkey ON public.user_one_time_keys USING btree (id, key_id);

alter table "public"."user_one_time_keys"
    add constraint "user_one_time_keys_pkey" PRIMARY KEY using index "user_one_time_keys_pkey";

create policy "Enable insert for own user only"
    on "public"."user_identity_keys"
    as permissive
    for insert
    to authenticated
    with check ((id = auth.uid()));


create policy "Enable insert for own user only"
    on "public"."user_one_time_keys"
    as permissive
    for insert
    to authenticated
    with check ((id = auth.uid()));



CREATE OR REPLACE FUNCTION get_keys_for_members(_room_id uuid, member_ids uuid[])
    RETURNS TABLE
            (
                member_id               uuid,
                identity_key_curve25519 text,
                one_time_key_id         text,
                one_time_key_curve25519 text
            )
AS
$$
BEGIN
    IF member_ids = '{}' THEN
        member_ids := ARRAY(SELECT room_members.member_id FROM public.room_members WHERE room_members.room_id = _room_id);
    END IF;
    RETURN QUERY
        WITH distinct_keys AS (SELECT DISTINCT ON (user_one_time_keys.id) user_one_time_keys.id, key_id, curve25519
                               FROM public.user_one_time_keys
                               WHERE user_one_time_keys.id = ANY(member_ids)),
             deleted_keys AS (
                 DELETE FROM public.user_one_time_keys
                     WHERE (user_one_time_keys.id, key_id) IN (SELECT distinct_keys.id, key_id FROM distinct_keys)
                     RETURNING user_one_time_keys.id, key_id, curve25519)
        SELECT rm.member_id,
               uik.curve25519 AS identity_key_curve25519,
               dk.key_id      AS one_time_key_id,
               dk.curve25519  AS one_time_key_curve25519
        FROM unnest(member_ids) rm(member_id)
                 JOIN public.user_identity_keys uik ON rm.member_id = uik.id
                 JOIN deleted_keys dk ON rm.member_id = dk.id;
END;
$$ LANGUAGE plpgsql;


create policy "Enable delete access for all users"
    on "public"."user_one_time_keys"
    as permissive
    for delete
    to authenticated
    using (true);


create policy "Enable read access for all users"
    on "public"."user_one_time_keys"
    as permissive
    for select
    to authenticated
    using (true);

create or replace function get_one_time_key(uid uuid)
    returns user_one_time_keys
    language plpgsql
as
$$
DECLARE
    key user_one_time_keys;
BEGIN
    SELECT *
    FROM user_one_time_keys
    WHERE id = uid
    INTO key;
    RETURN key;
END;
$$;


create table room_session_keys
(
    room_id uuid not null references rooms (id),
    key     text,
    key_of  uuid not null references auth.users (id),
    key_for uuid not null references auth.users (id),
    primary key (room_id, key_of, key_for)
);


CREATE OR REPLACE FUNCTION public.get_one_time_key(uid uuid)
    RETURNS user_one_time_keys
    LANGUAGE plpgsql
AS $function$
DECLARE
    key user_one_time_keys;
BEGIN
    SELECT * FROM user_one_time_keys
    WHERE id = uid
    INTO key;
    RETURN key;
END;
$function$
;

create policy "Enable read access for all users"
    on "public"."user_identity_keys"
    as permissive
    for select
    to public
    using (true);


