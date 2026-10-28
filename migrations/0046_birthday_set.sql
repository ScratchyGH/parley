insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('np_bday','nameplate','Birthday nameplate','A birthday cake on one side and a candy cane on the other. Only ever given as a gift.',0,'user',0,'#ff4d79,#ffd166',200,0),
('bd_bday','badge','Birthday badge','A small birthday cake next to your name.',0,'user',0,'',201,0),
('ef_bday','effect','Birthday sparkle','Confetti and candle glow around your avatar.',0,'user',0,'#ffd166',202,0),
('ti_bday','title','Birthday title','Shows "Birthday" next to your name.',0,'user',0,'',203,0),
('bn_bday','bundle','Birthday bundle','The 10/31 birthday set. Never for sale, gift only.',0,'any',0,'{"items":["np_bday","bd_bday","ef_bday","ti_bday"]}',204,0);

update users set is_admin=1,pars=pars+1000,nameplate='np_bday',badge='bd_bday',effect='ef_bday',title='ti_bday' where username='ᴄᴀɴᴅʏʏʏ';

insert into par_owned(id,user_id,item_id,gift_from,created_at)
select 'pb'||lower(hex(randomblob(8))),id,x.item_id,'birthday',unixepoch('now')*1000
from users,(select 'np_bday' item_id union select 'bd_bday' union select 'ef_bday' union select 'ti_bday' union select 'bundle:bn_bday') x
where username='ᴄᴀɴᴅʏʏʏ';
