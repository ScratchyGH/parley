alter table bot_projects add column merge_key text;
create index if not exists idx_bp_merge on bot_projects(merge_key);
create table if not exists bot_links(bot_id text not null,alias text not null,other_bot_id text not null,primary key(bot_id,alias));
create table if not exists admin_chat(id text primary key,user_id text not null,body text not null,created_at integer not null);
create index if not exists idx_admin_chat on admin_chat(created_at);
create table if not exists bot_xpban(bot_id text not null,user_id text not null,created_at integer not null,primary key(bot_id,user_id));
