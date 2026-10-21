create table xf_cfg(
server_id text not null,
feature text not null,
enabled integer not null default 0,
config text not null default '{}',
updated_at integer not null,
primary key(server_id,feature)
) without rowid;
create table xf_state(
server_id text not null,
k text not null,
v text not null,
primary key(server_id,k)
) without rowid;
create table xf_star(
message_id text primary key,
server_id text not null,
post_id text not null,
created_at integer not null
);
create table xf_xp(
server_id text not null,
user_id text not null,
xp integer not null default 0,
msgs integer not null default 0,
last_at integer not null default 0,
primary key(server_id,user_id)
) without rowid;
create index xf_xp_top on xf_xp(server_id,xp desc);
create table xf_rr(
message_id text not null,
emoji text not null,
server_id text not null,
role_id text not null,
primary key(message_id,emoji)
) without rowid;
create index xf_rr_srv on xf_rr(server_id);
create table xf_give(
id text primary key,
server_id text not null,
channel_id text not null,
message_id text not null,
prize text not null,
winners integer not null,
host_id text not null,
ends_at integer not null,
ended integer not null default 0,
winner_ids text not null default '[]',
created_at integer not null
);
create index xf_give_due on xf_give(ended,ends_at);
create index xf_give_srv on xf_give(server_id,created_at);
create table xf_count(
server_id text primary key,
last_n integer not null default 0,
last_user text,
best integer not null default 0,
resets integer not null default 0
);
create table xf_qotd(
id text primary key,
server_id text not null,
text text not null,
used_at integer,
created_at integer not null
);
create index xf_qotd_srv on xf_qotd(server_id,used_at);
create table xf_conf(
id text primary key,
server_id text not null,
user_id text not null,
text text not null,
message_id text,
created_at integer not null
);
create index xf_conf_srv on xf_conf(server_id,created_at);
create table xf_bday(
server_id text not null,
user_id text not null,
m integer not null,
d integer not null,
primary key(server_id,user_id)
) without rowid;
create index xf_bday_md on xf_bday(server_id,m,d);
create table xf_sugg(
id text primary key,
server_id text not null,
user_id text not null,
text text not null,
message_id text,
status text not null default 'open',
note text not null default '',
created_at integer not null
);
create index xf_sugg_srv on xf_sugg(server_id,created_at);
create table xf_sticky(
channel_id text primary key,
server_id text not null,
content text not null,
last_post text,
last_at integer not null default 0
);
create index xf_sticky_srv on xf_sticky(server_id);
