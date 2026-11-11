create table speak_grants(channel_id text not null,user_id text not null,granted_by text not null,created_at integer not null,primary key(channel_id,user_id));
create index idx_speak_grants_user on speak_grants(user_id);
alter table messages add column only_for text;
