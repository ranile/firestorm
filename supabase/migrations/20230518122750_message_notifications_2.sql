alter table "public"."web_push_subscriptions" add column "id" uuid not null default uuid_generate_v4();

CREATE UNIQUE INDEX web_push_subscriptions_pkey ON public.web_push_subscriptions USING btree (id);

alter table "public"."web_push_subscriptions" add constraint "web_push_subscriptions_pkey" PRIMARY KEY using index "web_push_subscriptions_pkey";

create policy "Users can manage their own notifications"
on "public"."web_push_subscriptions"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



