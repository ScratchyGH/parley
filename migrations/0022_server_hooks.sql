create table if not exists server_hooks(
id text primary key,
server_id text not null references servers(id) on delete cascade,
url text not null,
secret text not null,
events text not null,
enabled integer not null default 1,
fails integer not null default 0,
last_status integer,
last_at integer,
created_by text not null,
created_at integer not null
);
create index if not exists server_hooks_server on server_hooks(server_id);
