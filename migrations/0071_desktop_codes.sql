create table desktop_codes(code text primary key,user_id text not null,created_at integer not null,expires_at integer not null,used integer not null default 0);
create index idx_desktop_codes_expires on desktop_codes(expires_at);
