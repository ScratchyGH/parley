create table if not exists event_quests(id text primary key,season text not null,kind text not null,seq integer not null default 0,title text not null,descr text not null,metric text not null,target integer not null,candy integer not null default 0,xp integer not null default 0,enabled integer not null default 1);
create table if not exists event_progress(user_id text not null,quest_id text not null,day integer not null default 0,n integer not null default 0,updated_at integer not null,primary key(user_id,quest_id,day));
create table if not exists event_wallet(user_id text not null,season text not null,candy integer not null default 0,xp integer not null default 0,night_max integer not null default 1,updated_at integer not null,primary key(user_id,season));
create index if not exists event_wallet_xp on event_wallet(season,xp desc,updated_at);
create table if not exists event_tiers(season text not null,tier integer not null,xp_needed integer not null,candy integer not null default 0,item_id text,primary key(season,tier));
create table if not exists event_claims(user_id text not null,key text not null,created_at integer not null,primary key(user_id,key));
create table if not exists event_pumpkins(id text primary key,season text not null,slot text not null);
create table if not exists event_finds(user_id text not null,pumpkin_id text not null,found_at integer not null,primary key(user_id,pumpkin_id));
create table if not exists event_gifts(id text primary key,season text not null,from_user text not null,to_user text not null,created_at integer not null);
create index if not exists event_gifts_from on event_gifts(from_user,created_at);
create table if not exists event_night_runs(id text primary key,user_id text not null,night integer not null,started_at integer not null,finished_at integer,ok integer);
create index if not exists event_night_runs_u on event_night_runs(user_id,started_at);
insert or replace into event_quests(id,season,kind,seq,title,descr,metric,target,candy,xp) values
('n1','hollow','night',1,'Night 1: Clock In','Send 25 messages in server channels.','msg',25,60,100),
('n2','hollow','night',2,'Night 2: Dead Air','Spend 20 active minutes on shift in Parley.','shift_sec',1200,60,100),
('n3','hollow','night',3,'Night 3: Tape Seven','React to 30 messages. Eyes count double.','react',30,80,120),
('n4','hollow','night',4,'Night 4: The Plus One','Join a server with an invite link.','join',1,100,150),
('n5','hollow','night',5,'Night 5: Six A.M.','Survive 3 nights in the Night Shift simulator.','night_win',3,200,300),
('d1','hollow','daily',0,'Whisper in the Dark','Send 15 messages today.','msg',15,20,40),
('d2','hollow','daily',0,'Keep the Lights On','Spend 10 active minutes in Parley today.','shift_sec',600,25,40),
('d3','hollow','daily',0,'Boo-act','React to 5 messages today.','react',5,15,30),
('e1','hollow','event',0,'Pumpkin Patch','Find the hidden pumpkins tucked into menus, channels and corners.','pumpkin',13,150,250),
('e2','hollow','event',0,'Trick Or Treater','Send 3 gift pumpkins to other people.','gift_send',3,90,120),
('e3','hollow','event',0,'Survive The Week','Complete 5 daily quests.','daily_done',5,100,150);
insert or replace into event_tiers(season,tier,xp_needed,candy,item_id) values
('hollow',1,100,0,'bb_hollow'),
('hollow',2,200,50,null),
('hollow',3,300,0,'bd_lantern'),
('hollow',4,400,60,null),
('hollow',5,500,65,null),
('hollow',6,600,0,'ti_hollow'),
('hollow',7,700,75,null),
('hollow',8,800,80,null),
('hollow',9,900,0,'np_cobweb'),
('hollow',10,1000,90,null),
('hollow',11,1100,95,null),
('hollow',12,1200,0,'fr_ember_wreath'),
('hollow',13,1300,105,null),
('hollow',14,1400,110,null),
('hollow',15,1500,0,'nf_candle'),
('hollow',16,1600,120,null),
('hollow',17,1700,125,null),
('hollow',18,1800,0,'bd_nightguard'),
('hollow',19,1900,135,null),
('hollow',20,2000,140,null),
('hollow',21,2100,0,'fr_hollow_web'),
('hollow',22,2200,150,null),
('hollow',23,2300,155,null),
('hollow',24,2400,0,'fr_gravewarden');
insert or replace into event_pumpkins(id,season,slot) values
('p1','hollow','rail'),
('p2','hollow','composer'),
('p3','hollow','sidebar'),
('p4','hollow','topbar'),
('p5','hollow','members'),
('p6','hollow','pars'),
('p7','hollow','discover'),
('p8','hollow','friends'),
('p9','hollow','settings'),
('p10','hollow','hub'),
('p11','hollow','dm'),
('p12','hollow','server'),
('p13','hollow','messages');
insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('bb_hollow','bubble','Hollow message style','Messages get an ember edge and a flickering candle glow. Only from the Haunted Hollow event.',0,'user',0,'',900,0),
('bd_lantern','badge','Lantern pin','A glowing lantern next to your name. Only from the Haunted Hollow event.',0,'user',0,'',901,0),
('ti_hollow','title','Hollow Watcher title','Shows "Hollow Watcher" next to your name. Only from the Haunted Hollow event.',0,'user',0,'',902,0),
('np_cobweb','nameplate','Cobweb nameplate','Dusty cobwebs over a midnight violet plate. Only from the Haunted Hollow event.',0,'user',0,'',903,0),
('fr_ember_wreath','frame','Ember wreath frame','A wreath of glowing pumpkins and embers. Only from the Haunted Hollow event.',0,'user',0,'',904,0),
('nf_candle','namefx','Candlelight name','Letters that flicker like candle flame. Only from the Haunted Hollow event.',0,'user',0,'',905,0),
('bd_nightguard','badge','Night Guard badge','A night shift guard badge. Only from the Haunted Hollow event.',0,'user',0,'',906,0),
('fr_hollow_web','frame','Cobweb frame','A silver cobweb ring with a small spider. Only from the Haunted Hollow event.',0,'user',0,'',907,0),
('fr_gravewarden','frame','Gravewarden frame','An iron ring with a lantern and a skull crest. Only from the Haunted Hollow event.',0,'user',0,'',908,0),
('ti_gravewarden','title','Gravewarden title','Shows "Gravewarden" next to your name. Only from the Haunted Hollow event.',0,'user',0,'',909,0),
('fr_hollow_king','frame','Hollow King frame','A golden crowned ring with ember gems. A rare treat from the Haunted Hollow event.',0,'user',0,'',910,0),
('fr_grave_legend','frame','Grave Shift Legend frame','A spectral animated ring for the top of the leaderboard.',0,'user',0,'',911,0),
('ti_grave_shift_legend','title','Grave Shift Legend title','Shows "Grave Shift Legend" next to your name.',0,'user',0,'',912,0),
('np_tape','nameplate','Tape nameplate','A worn VHS tape label with a blinking REC light. Only from the Haunted Hollow event.',0,'user',0,'',913,0);
