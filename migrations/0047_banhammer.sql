insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('bh_hammer','weapon','Ban hammer','Swing it from someone''s profile. An AI checks the ban is reasonable before it lands.',0,'user',0,'',205,0);

insert into par_owned(id,user_id,item_id,gift_from,created_at)
select 'pb'||lower(hex(randomblob(8))),id,'bh_hammer','birthday',unixepoch('now')*1000
from users where username='ᴄᴀɴᴅʏʏʏ';
