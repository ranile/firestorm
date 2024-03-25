alter table "public"."messages" add column "reply_to" uuid;

alter table "public"."messages" add constraint "messages_reply_to_fkey" FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_reply_to_fkey";
