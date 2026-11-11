create table if not exists pm_users(id text primary key,local text not null unique,display text not null default '',pass_salt text not null,pass_hash text not null,pass_iters integer not null,kdf_salt text not null,pub text not null,priv_enc text not null,rec_salt text not null,priv_rec text not null,prefs text not null default '{}',created_at integer not null);
create table if not exists pm_sessions(id text primary key,user_id text not null,priv_sess text not null,label text not null default '',created_at integer not null,expires_at integer not null);
create index if not exists pm_sessions_user on pm_sessions(user_id);
create table if not exists pm_alias(addr text primary key,user_id text not null,label text not null default '',enabled integer not null default 1,created_at integer not null);
create index if not exists pm_alias_user on pm_alias(user_id);
create table if not exists pm_msgs(id text primary key,user_id text not null,folder text not null,from_addr text not null,to_addr text not null,ts integer not null,read integer not null default 0,star integer not null default 0,eph text not null,iv text not null,ct text not null);
create index if not exists pm_msgs_box on pm_msgs(user_id,folder,ts desc);
