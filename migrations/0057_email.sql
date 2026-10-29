alter table users add column email text;
alter table users add column email_verified integer not null default 0;
create unique index users_email_verified on users(lower(email)) where email_verified=1;
create table email_codes(
user_id text not null,
kind text not null,
email text not null,
code_hash text not null,
tries integer not null default 0,
expires_at integer not null,
primary key(user_id,kind)
);
