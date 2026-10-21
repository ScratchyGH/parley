alter table users add column effect text;
insert or ignore into par_items(id,kind,name,descr,price,scope,mb,data,sort) values
('np_sakura','nameplate','Sakura nameplate','Pink petals drifting behind your name.',5,'user',0,'#f472b6,#9d174d',14),
('np_nebula','nameplate','Nebula nameplate','Slowly shifting violet and blue with tiny stars.',5,'user',0,'#6d28d9,#1d4ed8',15),
('np_circuit','nameplate','Circuit nameplate','A green circuit board grid.',5,'user',0,'#059669,#064e3b',16),
('np_gold','nameplate','Gilded nameplate','Polished gold with a passing shine.',5,'user',0,'#f5c542,#92400e',17),
('np_glacier','nameplate','Glacier nameplate','Cold ice blue with a frosted edge.',5,'user',0,'#7dd3fc,#1e40af',18),
('np_sunset','nameplate','Sunset nameplate','Orange to magenta to indigo.',5,'user',0,'#fb923c,#7e22ce',19),
('np_neon','nameplate','Neon nameplate','A glowing cyan outline on dark glass.',5,'user',0,'#22d3ee,#0f172a',20),
('np_holo','nameplate','Holo nameplate','A slow rainbow shimmer.',5,'user',0,'#a78bfa,#34d399',21),
('ef_halo','effect','Angel halo','A glowing gold halo floating above your avatar.',15,'user',0,'#f5c542',40),
('ef_crown','effect','Crown','A small gold crown on your avatar.',20,'user',0,'#f5c542',41),
('ef_aurora','effect','Aurora ring','A slow rotating ring of teal, violet and pink.',15,'user',0,'#2dd4bf',42),
('ef_sparkle','effect','Sparkle','Twinkling stars around your avatar.',15,'user',0,'#fde68a',43),
('ef_ember','effect','Ember glow','A warm pulsing fire glow.',15,'user',0,'#fb923c',44),
('ef_neon','effect','Neon pulse','A pulsing cyan and magenta glow.',15,'user',0,'#22d3ee',45),
('ef_frost','effect','Frost','An icy shimmer with a pale blue glow.',15,'user',0,'#bae6fd',46),
('ef_void','effect','Void','A dark violet swirl ringing your avatar.',15,'user',0,'#7c3aed',47);
