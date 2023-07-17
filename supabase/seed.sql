alter publication supabase_realtime add table messages;

create extension http;


insert into private.settings (key, value)
values ('web_push_endpoint', '172.17.0.1:5173/api/web-push');

insert into private.settings (key, value)
values ('web_push_secret', 'xxx');
