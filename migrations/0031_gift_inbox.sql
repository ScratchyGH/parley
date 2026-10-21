create table if not exists gift_inbox(id text primary key,user_id text not null,from_name text not null,kind text not null,item_id text,label text not null,amount integer not null default 0,created_at integer not null,seen integer not null default 0);
create index if not exists gift_inbox_user on gift_inbox(user_id,seen,created_at);
;
