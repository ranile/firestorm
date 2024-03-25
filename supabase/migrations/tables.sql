create table rooms
(
    id         uuid                     not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    name       varchar(64)              not null,
    created_by uuid                     not null references profiles (id) on delete cascade
);


create table room_members
(
    room_id    uuid                     not null references rooms (id) on delete cascade,
    joined_at  timestamp with time zone not null default now(),
    member_id  uuid                     not null,
    join_state member_join_state        not null default 'invited',
    primary key (room_id, member_id)
);

create table profiles
(
    id       uuid not null primary key,
    username text not null unique,
    avatar   text
);

create table messages
(
    created_at timestamp with time zone not null default now(),
    content    varchar(6969)            not null,
    room_id    uuid                     not null references rooms (id) on delete cascade,
    author_id  uuid                     not null references profiles (id) on delete cascade,
    id         uuid                     not null default gen_random_uuid() primary key
);



create table user_identity_keys
(
    id           uuid not null primary key references profiles (id) on delete cascade,
    identity_key text not null,
    unique (id, identity_key)
);


create table user_one_time_keys
(
    id           uuid not null primary key references profiles (id) on delete cascade,
    one_time_key text not null,
    unique (id, one_time_key)
);

create type member_join_state as enum ('invited', 'joined');

create table web_push_subscriptions
(
    user_id       uuid not null default gen_random_uuid() primary key references profiles (id) on delete cascade,
    endpoint      text not null,
    "keys_p256dh" text not null,
    keys_auth     text
);

create table attachments
(
    id             uuid    not null primary key,
    message_id     uuid    not null references messages (id) on delete cascade,
    name           text    not null,
    type           text    not null,
    key_ciphertext text    not null,
    hashes         jsonb   not null,
    deleted        boolean not null                                    default false,
    reply_to       uuid    references messages (id) on delete set null default null
);



create table user_devices
(
    id        uuid not null references profiles (id) on delete cascade,
    device_id text not null,
    unique (id, device_id)
);

create table room_session_key_request
(
    room_id        uuid not null REFERENCES rooms (id) ON DELETE CASCADE,
    requested_by   uuid not null REFERENCES profiles (id) ON DELETE CASCADE,
    requested_from uuid not null REFERENCES profiles (id) ON DELETE CASCADE,
    primary key (room_id, requested_by, requested_from)
);


create table room_session_keys
(
    room_id uuid not null references rooms (id),
    key     text,
    key_of  uuid not null references profiles (id),
    key_for uuid not null references profiles (id),
    primary key (room_id, key_of, key_for)
);
