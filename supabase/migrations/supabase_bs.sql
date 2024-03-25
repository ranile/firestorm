
CREATE TABLE private.settings
(
    key   text not null primary key,
    value text not null
);


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_member_of(_user_id uuid, _room_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1
    FROM room_members rm
    WHERE rm.member_id = _user_id
      AND rm.room_id = _room_id
);
$function$
;


CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS $function$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$function$
;


CREATE OR REPLACE FUNCTION public.notify_messages()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
AS
$function$
DECLARE
    users   jsonb[];
    author  json;
    room    json;
    payload json;
BEGIN
    users := (SELECT array_agg(jsonb_build_object(
            'user_id', ws.user_id,
            'endpoint', ws.endpoint,
            'keys', jsonb_build_object('p256dh', ws.keys_p256dh, 'auth', ws.keys_auth)
                               ))
              FROM web_push_subscriptions ws
              WHERE EXISTS (SELECT 1
                            FROM room_members rm
                            WHERE rm.member_id = ws.user_id
                              AND rm.room_id = NEW.room_id));

    SELECT row_to_json((SELECT p
                        FROM (SELECT *
                              FROM profiles
                              WHERE id = NEW.author_id) AS p))
    into author;

    SELECT row_to_json((SELECT p
                        FROM (SELECT *
                              FROM rooms
                              WHERE id = NEW.room_id) AS p))
    into room;


    payload := jsonb_build_object(
            'channel', 'message',
            'message', json_build_object(
                    'id', NEW.id,
                    'content', NEW.content,
                    'created_at', NEW.created_at,
                    'room', room,
                    'author', author
                       ),
            'subscribers', (SELECT jsonb_agg(subscriber) FROM unnest(users) AS subscriber)
               );
    perform http((
                  'POST',
                  (select value
                   from private.settings
                   where key = 'web_push_endpoint'),
                  ARRAY [
                      http_header('Authorization', (select value from private.settings where key = 'web_push_secret'))
                      ],
                  'application/json',
                  payload::text
        ));
    RETURN NULL;
END;
$function$
;


-- CREATE TRIGGER messages_notification_trigger AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_messages();





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