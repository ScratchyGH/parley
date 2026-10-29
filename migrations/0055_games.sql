create table if not exists game_unlocks(user_id text not null,pack text not null,created_at integer not null,primary key(user_id,pack));
insert or ignore into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('fr_horror','frame','Cold Sweat frame','A pulsing blood-red ring that flickers like a failing light. Horror shop.',180,'user',0,'',900,1),
('ef_horror','effect','Shadow Crawl effect','Dark hands creeping up from below your avatar. Horror shop.',160,'user',0,'',901,1),
('np_horror','nameplate','Dead Channel nameplate','Static noise and a dim red scanline across your name. Horror shop.',140,'user',0,'',902,1),
('nf_horror','namefx','Glitched name','Letters that tear and flicker like a bad tape. Horror shop.',90,'user',0,'',903,1),
('bd_horror','badge','Eye badge','An eye that slowly opens next to your name. Horror shop.',70,'user',0,'',904,1),
('ti_horror','title','Night Shift title','Shows "Night Shift" next to your name. Horror shop.',60,'user',0,'',905,1),
('bb_horror','bubble','Bloodstain messages','Dark messages with a dripping red edge. Horror shop.',120,'user',0,'',906,1);
