CREATE SCHEMA private;

CREATE TABLE private.settings
(
    key   text not null primary key,
    value text not null
);

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
