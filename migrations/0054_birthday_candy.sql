update par_items set name='Birthday Bomb',descr='@ᴄᴀɴᴅʏʏʏ''s birthday set: party hat frame, falling lollipops, candle nameplate, rainbow name, cake badge, title and message style.' where id='bn_bday';
insert into par_owned(id,user_id,item_id,gift_from,created_at)
select 'pb'||lower(hex(randomblob(8))),u.id,'bh_hammer','birthday',unixepoch('now')*1000
from users u
where u.username='ParleyOfficial' collate nocase and not exists(select 1 from par_owned o where o.user_id=u.id and o.item_id='bh_hammer');
