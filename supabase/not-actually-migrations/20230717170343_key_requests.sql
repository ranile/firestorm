
alter table "public"."room_session_key_request"
    enable row level security;

create policy "Enable delete for users based on user_id"
    on "public"."room_session_key_request"
    as permissive
    for delete
    to public
    using ((auth.uid() = requested_from));

create policy "Users can request keys from others"
    on "public"."room_session_key_request"
    as permissive
    for insert
    to authenticated
    with check ((requested_by = auth.uid()));

create policy "Users on the receiving end of requests can read their requests"
    on "public"."room_session_key_request"
    as permissive
    for select
    to authenticated
    using ((requested_from = auth.uid()));
