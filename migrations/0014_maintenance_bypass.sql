create table if not exists maint_bypass(
session_id text primary key references sessions(id) on delete cascade,
created_at integer not null
);
