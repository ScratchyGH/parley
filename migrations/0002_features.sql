alter table messages add column has_poll integer not null default 0;
alter table messages add column thread_id text;
alter table messages add column sig text;
alter table files add column sha256 text;
alter table files add column verified integer not null default 0;
alter table servers add column automod text not null default '';
alter table users add column totp_secret text;
alter table users add column totp_on integer not null default 0;
alter table users add column backup_hashes text;
alter table users add column is_bot integer not null default 0;
create table threads(
id text primary key,
channel_id text not null,
server_id text not null,
parent_message_id text,
name text not null,
owner_id text not null,
created_at integer not null,
last_msg text not null default '',
last_at integer not null default 0,
count integer not null default 0,
locked integer not null default 0,
archived integer not null default 0
);
create index threads_ch on threads(channel_id,last_at desc);
create unique index threads_parent on threads(parent_message_id) where parent_message_id is not null;
create table polls(
message_id text primary key,
question text not null,
multi integer not null default 0,
closes_at integer
);
create table poll_options(
message_id text not null,
idx integer not null,
text text not null,
primary key(message_id,idx)
);
create table poll_votes(
message_id text not null,
user_id text not null,
idx integer not null,
primary key(message_id,user_id,idx)
);
create table events(
id text primary key,
server_id text not null,
creator_id text not null,
title text not null,
description text not null default '',
location text not null default '',
starts_at integer not null,
ends_at integer,
created_at integer not null
);
create index events_srv on events(server_id,starts_at);
create table event_rsvps(
event_id text not null,
user_id text not null,
state text not null,
primary key(event_id,user_id)
);
create table emoji(
id text primary key,
server_id text not null,
name text not null,
file_id text not null,
created_by text not null,
created_at integer not null,
unique(server_id,name)
);
create table uploads(
id text primary key,
owner_id text not null,
kind text not null,
room text,
server_id text,
name text not null,
mime text not null,
size integer not null,
sha256 text,
r2_key text not null,
upload_id text not null,
part_size integer not null,
created_at integer not null
);
create index uploads_owner on uploads(owner_id);
create table push_subs(
id text primary key,
user_id text not null,
endpoint text not null unique,
p256dh text not null,
auth text not null,
created_at integer not null
);
create index push_user on push_subs(user_id);
create table webhooks(
id text primary key,
server_id text not null,
channel_id text not null,
name text not null,
token_hash text not null,
bot_user_id text not null,
created_by text not null,
created_at integer not null
);
create index webhooks_srv on webhooks(server_id);
