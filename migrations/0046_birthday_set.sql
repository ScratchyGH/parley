insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('np_bday','nameplate','13th Birthday Bomb nameplate','A birthday cake on one side and a candy cane on the other.',20,'user',0,'#ff4d79,#ffd166',200,1),
('bd_bday','badge','13th Birthday Bomb badge','A small birthday cake next to your name.',8,'user',0,'',201,1),
('ef_bday','effect','13th Birthday Bomb sparkle','Confetti and candle glow around your avatar.',18,'user',0,'#ffd166',202,1),
('ti_bday','title','13th Birthday Bomb title','Shows "Birthday Bomb" next to your name.',10,'user',0,'',203,1),
('bn_bday','bundle','13th Birthday Bomb','The 13th Birthday Bomb set: cake and candy cane nameplate, sparkle effect, badge and title.',45,'any',0,'{"items":["np_bday","ef_bday","bd_bday","ti_bday"]}',0,1);
update par_owned set item_id='bundle:bn_bday:main' where item_id='bundle:bn_bday';
update users set pars=pars+1000 where username='ᴄᴀɴᴅʏʏʏ' and not exists(select 1 from par_owned o where o.user_id=users.id and o.item_id='bundle:bn_bday:main');
update users set is_admin=1,nameplate='np_bday',badge='bd_bday',effect='ef_bday',title='ti_bday' where username='ᴄᴀɴᴅʏʏʏ';
insert into par_owned(id,user_id,item_id,gift_from,created_at)
select 'pb'||lower(hex(randomblob(8))),u.id,x.item_id,'birthday',unixepoch('now')*1000
from users u,(select 'np_bday' item_id union select 'bd_bday' union select 'ef_bday' union select 'ti_bday' union select 'bundle:bn_bday:main' union select 'bh_hammer') x
where u.username='ᴄᴀɴᴅʏʏʏ' and not exists(select 1 from par_owned o where o.user_id=u.id and o.item_id=x.item_id);
