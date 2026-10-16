alter table users add column labs integer not null default 0;
alter table users add column adult_ok integer not null default 0;
alter table servers add column age_restricted integer not null default 0;
alter table servers add column scan_explicit integer not null default 0;
update users set labs=1 where id=(select id from users order by created_at,rowid limit 1);
create trigger if not exists first_user_labs after insert on users when new.is_bot=0 and (select count(*) from users where is_bot=0)=1 begin update users set labs=1 where id=new.id; end;
