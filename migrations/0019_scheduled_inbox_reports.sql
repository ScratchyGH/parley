create table scheduled_msgs(id text primary key,user_id text not null,room text not null,content text not null,reply_to text,send_at integer not null,status text not null default 'pending',error text,created_at integer not null);
create index scheduled_due on scheduled_msgs(status,send_at);
create index scheduled_user on scheduled_msgs(user_id,status,send_at);
create table content_reports(id text primary key,reporter_id text not null,category text not null,target_type text not null,target_id text not null,server_id text,details text not null default '',status text not null default 'open',reviewer_id text,decision text,created_at integer not null,resolved_at integer);
create index content_reports_status on content_reports(status,created_at desc);
create table blocked_hashes(hash text primary key,reason text not null default '',added_by text,created_at integer not null) without rowid;
