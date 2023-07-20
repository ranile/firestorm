alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table room_session_key_request;

create extension http;


insert into private.settings (key, value)
values ('web_push_endpoint', '172.17.0.1:5173/api/web-push');

insert into private.settings (key, value)
values ('web_push_secret', 'xxx');
