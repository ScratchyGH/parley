create table users(
id text primary key,
username text not null unique collate nocase,
display_name text not null,
pass_hash text not null,
pass_salt text not null,
pass_iters integer not null,
recovery_hash text,
avatar_id text,
banner_id text,
bio text not null default '',
pronouns text not null default '',
status_text text not null default '',
presence text not null default 'online',
accent text,
settings text not null default '{}',
is_admin integer not null default 0,
suspended integer not null default 0,
deleted_at integer,
created_at integer not null
);
create table sessions(
id text primary key,
user_id text not null references users(id) on delete cascade,
created_at integer not null,
expires_at integer not null,
last_seen integer not null,
ua text not null default '',
ip text not null default ''
);
create index sessions_user on sessions(user_id);
create table login_attempts(k text primary key,n integer not null,reset_at integer not null);
create table files(
id text primary key,
owner_id text not null,
kind text not null,
room text,
server_id text,
message_id text,
r2_key text not null,
name text not null,
mime text not null,
size integer not null,
created_at integer not null
);
create index files_room on files(room,created_at desc);
create index files_msg on files(message_id);
create index files_owner on files(owner_id);
create table servers(
id text primary key,
owner_id text not null references users(id),
name text not null,
description text not null default '',
icon_id text,
banner_id text,
is_public integer not null default 0,
category text not null default '',
accent text,
welcome text not null default '',
rules text not null default '',
verification integer not null default 0,
created_at integer not null
);
create index servers_public on servers(is_public,category);
create table roles(
id text primary key,
server_id text not null references servers(id) on delete cascade,
name text not null,
color text,
position integer not null default 0,
perms integer not null default 0,
is_everyone integer not null default 0
);
create index roles_server on roles(server_id);
create table members(
server_id text not null references servers(id) on delete cascade,
user_id text not null references users(id) on delete cascade,
nickname text,
joined_at integer not null,
timeout_until integer not null default 0,
muted integer not null default 0,
primary key(server_id,user_id)
);
create index members_user on members(user_id);
create table member_roles(
server_id text not null,
user_id text not null,
role_id text not null references roles(id) on delete cascade,
primary key(server_id,user_id,role_id)
);
create table categories(
id text primary key,
server_id text not null references servers(id) on delete cascade,
name text not null,
position integer not null default 0
);
create table channels(
id text primary key,
server_id text not null references servers(id) on delete cascade,
category_id text,
name text not null,
type text not null default 'text',
topic text not null default '',
position integer not null default 0,
readonly integer not null default 0,
locked integer not null default 0,
slowmode integer not null default 0,
last_msg text not null default '',
created_at integer not null
);
create index channels_server on channels(server_id,position);
create table overrides(
channel_id text not null references channels(id) on delete cascade,
target_type text not null,
target_id text not null,
allow integer not null default 0,
deny integer not null default 0,
primary key(channel_id,target_type,target_id)
);
create table invites(
code text primary key,
server_id text not null references servers(id) on delete cascade,
inviter_id text not null,
expires_at integer,
max_uses integer,
uses integer not null default 0,
revoked integer not null default 0,
created_at integer not null
);
create table bans(
server_id text not null references servers(id) on delete cascade,
user_id text not null,
reason text not null default '',
by_id text not null,
created_at integer not null,
primary key(server_id,user_id)
);
create table conversations(
id text primary key,
type text not null,
name text not null default '',
icon_id text,
owner_id text,
dm_key text unique,
created_at integer not null,
last_msg text not null default '',
last_message_at integer not null default 0
);
create table conv_members(
conv_id text not null references conversations(id) on delete cascade,
user_id text not null references users(id) on delete cascade,
joined_at integer not null,
muted integer not null default 0,
hidden integer not null default 0,
accepted integer not null default 1,
primary key(conv_id,user_id)
);
create index conv_members_user on conv_members(user_id);
create table messages(
id text primary key,
room text not null,
server_id text,
author_id text not null,
content text not null,
reply_to text,
created_at integer not null,
edited_at integer,
deleted_at integer,
pinned integer not null default 0,
nonce text
);
create index messages_room on messages(room,id);
create unique index messages_nonce on messages(author_id,nonce) where nonce is not null;
create table reactions(
message_id text not null,
user_id text not null,
emoji text not null,
primary key(message_id,user_id,emoji)
);
create index reactions_msg on reactions(message_id);
create table read_state(
user_id text not null,
room text not null,
last_read text not null default '',
mentions integer not null default 0,
primary key(user_id,room)
);
create table friends(
a text not null,
b text not null,
status text not null,
requester text not null,
created_at integer not null,
primary key(a,b)
);
create index friends_b on friends(b);
create table blocks(
user_id text not null,
blocked_id text not null,
created_at integer not null,
primary key(user_id,blocked_id)
);
create table notifications(
id text primary key,
user_id text not null,
type text not null,
data text not null,
created_at integer not null,
read_at integer
);
create index notif_user on notifications(user_id,created_at desc);
create table saved(
user_id text not null,
message_id text not null,
created_at integer not null,
primary key(user_id,message_id)
);
create table reports(
id text primary key,
reporter_id text not null,
target_type text not null,
target_id text not null,
server_id text,
reason text not null,
status text not null default 'open',
created_at integer not null
);
create index reports_status on reports(status,created_at desc);
create table mod_log(
id text primary key,
server_id text,
actor_id text not null,
action text not null,
target_id text,
detail text not null default '',
created_at integer not null
);
create index mod_log_server on mod_log(server_id,created_at desc);
create table appeals(
id text primary key,
user_id text not null,
server_id text,
message text not null,
status text not null default 'open',
created_at integer not null
);
create table app_settings(k text primary key,v text not null);
