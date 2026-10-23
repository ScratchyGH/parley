create table reminders(id text primary key,user_id text not null,room text,server_id text,message_id text,note text not null default '',at integer not null,done integer not null default 0,created_at integer not null);
create index reminders_due on reminders(done,at);
create index reminders_user on reminders(user_id,done);
