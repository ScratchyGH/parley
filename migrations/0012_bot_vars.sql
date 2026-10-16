create table bot_vars(
bot_id text not null,
server_id text not null,
k text not null,
v integer not null default 0,
primary key(bot_id,server_id,k)
) without rowid;
