insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('np_bday','nameplate','13th Birthday Bomb nameplate','A birthday cake on one side and a candy cane on the other.',20,'user',0,'#ff4d79,#ffd166',200,1),
('bd_bday','badge','13th Birthday Bomb badge','A small birthday cake next to your name.',8,'user',0,'',201,1),
('ef_bday','effect','13th Birthday Bomb sparkle','Confetti and candle glow around your avatar.',18,'user',0,'#ffd166',202,1),
('ti_bday','title','13th Birthday Bomb title','Shows "Birthday Bomb" next to your name.',10,'user',0,'',203,1),
('bn_bday','bundle','13th Birthday Bomb','The 13th Birthday Bomb set: cake and candy cane nameplate, sparkle effect, badge and title.',45,'any',0,'{"items":["np_bday","ef_bday","bd_bday","ti_bday"]}',0,1);
update par_owned set item_id='bundle:bn_bday:main' where item_id='bundle:bn_bday' and not exists(select 1 from par_owned x where x.user_id=par_owned.user_id and x.item_id='bundle:bn_bday:main');
