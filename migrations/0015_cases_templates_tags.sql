alter table servers add column tag text;
alter table users add column tag_server text;
create table if not exists mod_cases(
id text primary key,
server_id text not null references servers(id) on delete cascade,
num integer not null,
user_id text not null,
mod_id text not null,
type text not null,
reason text not null default '',
evidence text not null default '',
status text not null default 'open',
created_at integer not null,
updated_at integer not null,
unique(server_id,num)
);
create index if not exists mod_cases_user on mod_cases(server_id,user_id,created_at);
create index if not exists mod_cases_list on mod_cases(server_id,created_at);
create table if not exists server_templates(
code text primary key,
server_id text not null references servers(id) on delete cascade,
name text not null,
description text not null default '',
layout text not null,
uses integer not null default 0,
created_by text not null,
created_at integer not null
);
create index if not exists server_templates_server on server_templates(server_id);
drop table if exists maint_bypass;
