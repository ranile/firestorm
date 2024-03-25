

alter table "public"."web_push_subscriptions" enable row level security;

alter table "public"."web_push_subscriptions" add constraint "web_push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."web_push_subscriptions" validate constraint "web_push_subscriptions_user_id_fkey";

set check_function_bodies = off;
