insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('fr_bday','frame','Birthday Bomb frame','A candy cane ring with a party hat and balloons.',0,'user',0,'',204,0),
('nf_bday','namefx','Birthday Bomb name','Letters that cycle through confetti colors.',0,'user',0,'',206,0),
('bb_bday','bubble','Birthday Bomb message style','Messages get a pink edge and a sprinkle of confetti.',0,'user',0,'',207,0);
update par_items set price=65,descr='The full 13th birthday set: party hat frame, candle nameplate, confetti sparkle, rainbow name, cake badge, title and message style.',data='{"items":["fr_bday","ef_bday","np_bday","nf_bday","bd_bday","ti_bday","bb_bday"],"season":"bday13"}' where id='bn_bday';
insert into par_owned(id,user_id,item_id,gift_from,created_at)
select 'pb'||lower(hex(randomblob(8))),u.id,x.item_id,'birthday',unixepoch('now')*1000
from users u,(select 'fr_bday' item_id union select 'nf_bday' union select 'bb_bday') x
where u.username='ᴄᴀɴᴅʏʏʏ' and not exists(select 1 from par_owned o where o.user_id=u.id and o.item_id=x.item_id);
update users set frame='fr_bday',namefx='nf_bday',bubble='bb_bday' where username='ᴄᴀɴᴅʏʏʏ';
