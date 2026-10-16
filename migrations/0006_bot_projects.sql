create table bot_projects(
id text primary key,
owner_id text not null,
bot_id text not null unique,
slug text not null unique collate nocase,
name text not null,
summary text not null default '',
readme text not null default '',
avatar_id text,
license text not null default 'ARR',
license_url text not null default '',
source_url text not null default '',
website_url text not null default '',
support_url text not null default '',
visibility text not null default 'private',
installs integer not null default 0,
created_at integer not null,
updated_at integer not null
);
create index bot_projects_owner on bot_projects(owner_id,updated_at desc);
create index bot_projects_pub_installs on bot_projects(installs desc,updated_at desc) where visibility='public';
create index bot_projects_pub_new on bot_projects(created_at desc) where visibility='public';
create index bot_projects_pub_upd on bot_projects(updated_at desc) where visibility='public';
create table bot_project_tags(
project_id text not null,
tag text not null,
primary key(tag,project_id)
) without rowid;
create index bot_project_tags_p on bot_project_tags(project_id);
create table bot_releases(
id text primary key,
project_id text not null,
version text not null,
changelog text not null default '',
created_at integer not null
);
create index bot_releases_p on bot_releases(project_id,created_at desc);
create table bot_installs(
project_id text not null,
server_id text not null,
user_id text not null,
created_at integer not null,
primary key(project_id,server_id)
) without rowid;
create index bot_installs_s on bot_installs(server_id);
