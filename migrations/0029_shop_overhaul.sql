alter table users add column title text;
alter table users add column bubble text;
insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('ti_walker','title','Void Walker title','Shows "Void Walker" next to your name.',10,'user',0,'',100,1),
('ti_chosen','title','Chosen One title','Shows "Chosen One" next to your name.',10,'user',0,'',101,1),
('ti_demon','title','Demon Lord title','Shows "Demon Lord" next to your name.',10,'user',0,'',102,1),
('ti_royal','title','Royalty title','Shows "Royalty" next to your name.',10,'user',0,'',103,1),
('ti_builder','title','Master Builder title','Shows "Master Builder" next to your name.',10,'user',0,'',104,1),
('ti_frost','title','Frostborn title','Shows "Frostborn" next to your name.',10,'user',0,'',105,1),
('ti_petal','title','Petal Dancer title','Shows "Petal Dancer" next to your name.',10,'user',0,'',106,1),
('ti_veteran','title','Veteran title','Shows "Veteran" next to your name.',10,'user',0,'',107,1),
('ti_night','title','Night Owl title','Shows "Night Owl" next to your name.',10,'user',0,'',108,1),
('ti_time','title','Timeskipper title','Shows "Timeskipper" next to your name. Only in the Timeskipper bundle.',10,'user',0,'',109,0),
('bb_void','bubble','Void message style','Messages get a violet edge and faint starfield.',14,'user',0,'',120,1),
('bb_god','bubble','Radiant message style','Messages get a golden edge and soft glow.',14,'user',0,'',121,1),
('bb_devil','bubble','Infernal message style','Messages get a red edge with an ember glow.',14,'user',0,'',122,1),
('bb_royal','bubble','Royal message style','Messages get a gold and purple edge.',14,'user',0,'',123,1),
('bb_blox','bubble','Brick message style','Messages get a bright red brick edge.',14,'user',0,'',124,1),
('bb_frost','bubble','Frost message style','Messages get an icy blue edge.',14,'user',0,'',125,1),
('bb_sakura','bubble','Blossom message style','Messages get a pink edge.',14,'user',0,'',126,1),
('bb_ocean','bubble','Ocean message style','Messages get a teal edge.',14,'user',0,'',127,1),
('bb_mint','bubble','Mint message style','Messages get a fresh green edge.',14,'user',0,'',128,1),
('bb_time','bubble','Timeskipper message style','Messages get a drifting clock-hand edge. Only in the Timeskipper bundle.',14,'user',0,'',129,0),
('fr_time','frame','Timeskipper frame','An animated clockwork ring with turning hands. Only in the Timeskipper bundle.',40,'user',0,'',130,0),
('ef_time','effect','Timeskipper effect','Clock hands sweeping around your avatar. Only in the Timeskipper bundle.',30,'user',0,'',131,0),
('np_time','nameplate','Timeskipper nameplate','A nameplate with slowly sliding gears. Only in the Timeskipper bundle.',30,'user',0,'',132,0),
('nf_time','namefx','Timeskipper name','Letters that shift through dawn, noon and dusk. Only in the Timeskipper bundle.',16,'user',0,'',133,0),
('bd_time','badge','Timeskipper badge','An hourglass next to your name. Only in the Timeskipper bundle.',10,'user',0,'',134,0);
update par_items set price=8 where id in ('bd_star','bd_flame','bd_gem','bd_crown','bd_bolt','bd_heart','bd_skull','bd_leaf','bd_blocks','bd_ghost');
update par_items set price=10 where id in ('np_ember','np_aurora','np_graphite','np_rose','np_sakura','np_nebula','np_circuit','np_gold','np_glacier','np_sunset','np_neon','np_holo');
update par_items set price=12 where id in ('nf_gold','nf_rainbow','nf_fire','nf_ice','nf_neon','nf_sakura','nf_void','nf_toxic');
update par_items set price=14 where id in ('fr_gold','fr_mint','fr_violet','fr_rose');
update par_items set price=18 where id in ('fr_ruby','fr_ice','fr_obsidian','fr_duo','fr_emerald','ef_aurora','ef_sparkle','ef_ember','ef_neon','ef_frost','ef_void','ef_snow','ef_matrix','ef_double','ef_halo');
update par_items set price=20 where id in ('np_katana','np_inferno','np_glitch','np_storm','np_rune','np_hud','np_dragon','np_pixel','np_ink','np_ribbon','np_void','np_blox');
update par_items set price=24 where id in ('ef_crown','ef_orbit','ef_hearts','ef_thunder','ef_ears','ef_rainbow');
update par_items set price=30 where id in ('np_god','fr_void','fr_halo','fr_devil','fr_blox');
update par_items set price=30 where id='vanity';
update par_items set price=40 where id='up_25';
update par_items set price=60 where id='up_45';
update par_items set price=100 where id='up_65';
insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('bn_time','bundle','Timeskipper bundle','Limited time. An animated frame, avatar effect and nameplate, a shifting name, hourglass badge, title, message style and a free year of vanity link.',168,'any',0,'{"variants":{"main":{"label":"Timeskipper","items":["fr_time","ef_time","np_time","nf_time","bd_time","ti_time","bb_time"],"vanity_days":365,"price":168,"gift_price":151,"server_price":122}},"limited":true,"ends_at":1795323600000}',1,1),
('bn_void','bundle','Void bundle','The Void set. Legacy is the classic frame, nameplate and a month of vanity link. Modern adds an effect, name style, badge, title and message style.',52,'any',0,'{"variants":{"legacy":{"label":"Legacy","items":["fr_void","np_void"],"vanity_days":30,"price":52,"gift_price":47,"server_price":10},"modern":{"label":"Modern","items":["fr_void","np_void","ef_void","nf_void","bd_ghost","ti_walker","bb_void"],"vanity_days":90,"price":114,"gift_price":103,"server_price":30}}}',2,1),
('bn_god','bundle','Eyes of God bundle','Radiance and wings. Legacy is the classic frame, exclusive nameplate and a month of vanity link. Modern adds halo effect, gold name, crown badge, title and message style.',60,'any',0,'{"variants":{"legacy":{"label":"Legacy","items":["fr_halo","np_god"],"vanity_days":30,"price":60,"gift_price":54,"server_price":10},"modern":{"label":"Modern","items":["fr_halo","np_god","ef_halo","nf_gold","bd_crown","ti_chosen","bb_god"],"vanity_days":90,"price":122,"gift_price":110,"server_price":30}}}',3,1),
('bn_devil','bundle','Devils Demise bundle','Horns, tail and flame. Legacy is the classic frame and nameplate. Modern adds ember effect, fire name, flame badge, title, message style and a month of vanity link.',42,'any',0,'{"variants":{"legacy":{"label":"Legacy","items":["fr_devil","np_inferno"],"vanity_days":0,"price":42,"gift_price":38,"server_price":0},"modern":{"label":"Modern","items":["fr_devil","np_inferno","ef_ember","nf_fire","bd_flame","ti_demon","bb_devil"],"vanity_days":30,"price":98,"gift_price":88,"server_price":10}}}',4,1),
('bn_royal','bundle','Royal Court bundle','Gold and crowns. Legacy is the classic five. Modern adds a title, message style and a month of vanity link.',58,'any',0,'{"variants":{"legacy":{"label":"Legacy","items":["np_gold","fr_gold","ef_crown","nf_gold","bd_crown"],"vanity_days":0,"price":58,"gift_price":52,"server_price":0},"modern":{"label":"Modern","items":["np_gold","fr_gold","ef_crown","nf_gold","bd_crown","ti_royal","bb_royal"],"vanity_days":30,"price":82,"gift_price":74,"server_price":10}}}',8,1),
('bn_blox','bundle','Bloxtime bundle','A brick-built set: frame, nameplate, badge, title and message style.',66,'any',0,'{"variants":{"main":{"label":"Bundle","items":["fr_blox","np_blox","bd_blocks","ti_builder","bb_blox"],"vanity_days":0,"price":66,"gift_price":59,"server_price":0}}}',5,1),
('bn_sakura','bundle','Sakura Dream bundle','Soft and pink: nameplate, frame, hearts effect, name style, badge, title and message style.',74,'any',0,'{"variants":{"main":{"label":"Bundle","items":["np_sakura","fr_rose","ef_hearts","nf_sakura","bd_heart","ti_petal","bb_sakura"],"vanity_days":0,"price":74,"gift_price":67,"server_price":0}}}',6,1),
('bn_frost','bundle','Frostbite bundle','Cold and sharp: nameplate, frame, snowfall effect, name style, badge, title and message style.',72,'any',0,'{"variants":{"main":{"label":"Bundle","items":["np_glacier","fr_ice","ef_snow","nf_ice","bd_gem","ti_frost","bb_frost"],"vanity_days":0,"price":72,"gift_price":65,"server_price":0}}}',7,1);
create index if not exists par_tx_note on par_tx(kind,user_id);
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_void:legacy',min(created_at) from par_tx where kind='purchase' and note like 'Void bundle%' group by user_id;
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_god:legacy',min(created_at) from par_tx where kind='purchase' and note like 'Eyes of God bundle%' group by user_id;
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_devil:legacy',min(created_at) from par_tx where kind='purchase' and note like 'Devils Demise bundle%' group by user_id;
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_royal:legacy',min(created_at) from par_tx where kind='purchase' and note like 'Royal Court bundle%' group by user_id;
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_blox:main',min(created_at) from par_tx where kind='purchase' and note like 'Bloxtime bundle%' group by user_id;
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_sakura:main',min(created_at) from par_tx where kind='purchase' and note like 'Sakura Dream bundle%' group by user_id;
insert into par_owned(id,user_id,item_id,created_at) select 'pb'||lower(hex(randomblob(8))),user_id,'bundle:bn_frost:main',min(created_at) from par_tx where kind='purchase' and note like 'Frostbite bundle%' group by user_id;
create unique index par_owned_bundle on par_owned(user_id,item_id) where item_id like 'bundle:%';
