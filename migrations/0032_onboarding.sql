alter table servers add column onboarding text not null default '';
create table if not exists onboard_done(server_id text not null,user_id text not null,created_at integer not null,primary key(server_id,user_id));
