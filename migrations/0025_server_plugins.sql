create table if not exists server_plugins(
server_id text not null references servers(id) on delete cascade,
plugin text not null,
enabled integer not null default 0,
config text not null default '{}',
updated_at integer not null,
primary key(server_id,plugin)
);
