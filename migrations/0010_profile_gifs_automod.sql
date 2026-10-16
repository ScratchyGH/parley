alter table users add column status_until integer;
alter table users add column links text not null default '[]';
create table profile_images(
user_id text not null,
kind text not null,
file_id text not null,
created_at integer not null,
primary key(user_id,kind,file_id)
) without rowid;
create index profile_images_recent on profile_images(user_id,kind,created_at);
create table gif_favs(
user_id text not null,
gif_id text not null,
title text not null default '',
preview text not null,
url text not null,
created_at integer not null,
primary key(user_id,gif_id)
) without rowid;
create table user_notes(
user_id text not null,
target_id text not null,
note text not null,
updated_at integer not null,
primary key(user_id,target_id)
) without rowid;
