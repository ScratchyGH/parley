alter table users add column suspended_until integer;
alter table users add column suspend_reason text;
alter table appeals add column evidence text;
alter table servers add column retention_days integer not null default 0;
create table user_devices(user_id text not null,hash text not null,last_seen integer not null,primary key(user_id,hash)) without rowid;
create index user_devices_hash on user_devices(hash);
create table device_bans(hash text primary key,user_id text,reason text not null default '',created_at integer not null) without rowid;
create table client_errors(id text primary key,user_id text,msg text not null,src text,ua text,url text,created_at integer not null);
create index client_errors_t on client_errors(created_at desc);
