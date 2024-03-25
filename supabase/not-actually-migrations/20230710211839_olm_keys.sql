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


create policy "Enable read access for all users"
    on "public"."user_identity_keys"
    as permissive
    for select
    to public
    using (true);


