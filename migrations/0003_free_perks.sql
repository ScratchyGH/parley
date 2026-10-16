create table username_claims(
norm text primary key,
user_id text not null,
name text not null,
created_at integer not null
);
create index username_claims_user on username_claims(user_id,created_at);
insert or ignore into username_claims(norm,user_id,name,created_at) select replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(username),'.',''),'-',''),'_',''),'0','o'),'1','l'),'i','l'),'5','s'),'3','e'),'4','a'),'7','t'),'8','b'),id,username,created_at from users where deleted_at is null and is_bot=0;
create table stickers(
id text primary key,
server_id text,
owner_id text,
name text not null,
file_id text not null,
created_at integer not null
);
create index stickers_server on stickers(server_id);
create index stickers_owner on stickers(owner_id);
alter table messages add column sticker_id text;
alter table servers add column lockdown_until integer not null default 0;
alter table servers add column vanity text;
create unique index servers_vanity on servers(vanity collate nocase) where vanity is not null;
alter table users add column bot_owner text;
create table bot_tokens(
token_hash text primary key,
bot_id text not null,
created_at integer not null
);
create index bot_tokens_bot on bot_tokens(bot_id);
