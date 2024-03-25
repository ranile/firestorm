CREATE SCHEMA private;

CREATE TABLE private.settings
(
    key   text not null primary key,
    value text not null
);
