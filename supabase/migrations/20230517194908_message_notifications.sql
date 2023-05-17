create table "public"."web_push_subscriptions" (
    "user_id" uuid not null,
    "endpoint" text not null,
    "keys_p256dh" text not null,
    "keys_auth" text
);


alter table "public"."web_push_subscriptions" enable row level security;

alter table "public"."web_push_subscriptions" add constraint "web_push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."web_push_subscriptions" validate constraint "web_push_subscriptions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.notify_messages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    users   jsonb[];
    author   json;
    room   json;
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
                              WHERE id = NEW.author_id) AS p)) into author;

    SELECT row_to_json((SELECT p
                        FROM (SELECT *
                              FROM rooms
                              WHERE id = NEW.room_id) AS p)) into room;


    payload := jsonb_build_object(
            'message', json_build_object(
                    'id', NEW.id,
                    'content', NEW.content,
                    'created_at', NEW.created_at,
                    'room', room,
                    'author', author
                ),
            'subscribers', (SELECT jsonb_agg(subscriber) FROM unnest(users) AS subscriber)
        );
    perform pg_notify('msg_chan', payload::text);
    RETURN NULL;
END;
$function$
;

CREATE TRIGGER messages_notification_trigger AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_messages();


