alter table users add column pars integer not null default 0;
alter table users add column seen_version text;
alter table users add column nameplate text;
alter table users add column frame text;
alter table servers add column exp_state text;
alter table servers add column exp_on integer not null default 0;
alter table servers add column exp_block integer not null default 0;
alter table servers add column exp_at integer;
alter table servers add column block_ext_emoji integer not null default 0;
create table par_tx(id text primary key,user_id text not null,delta integer not null,kind text not null,ref text,note text not null default '',created_at integer not null);
create index par_tx_u on par_tx(user_id,created_at desc);
create unique index par_tx_ref on par_tx(user_id,kind,ref) where ref is not null;
create table par_beats(user_id text primary key,last_beat integer not null,credit_ms integer not null default 0,total_ms integer not null default 0,day text not null default '',day_ms integer not null default 0,strikes integer not null default 0,last_i integer not null default 0,same integer not null default 0);
create table par_items(id text primary key,kind text not null,name text not null,descr text not null default '',price integer not null,scope text not null,mb integer not null default 0,data text not null default '',enabled integer not null default 1,sort integer not null default 0);
create table par_owned(id text primary key,user_id text not null,item_id text not null,server_id text,gift_from text,created_at integer not null);
create index par_owned_u on par_owned(user_id,item_id);
create index par_owned_s on par_owned(server_id,item_id);
insert into par_items(id,kind,name,descr,price,scope,mb,data,sort) values
('vanity','vanity','Vanity server link','A custom short invite link for one server.',25,'server',0,'',1),
('np_ember','nameplate','Ember nameplate','Warm gradient behind your name.',5,'user',0,'#c2410c,#7c2d12',10),
('np_aurora','nameplate','Aurora nameplate','Teal and violet gradient behind your name.',5,'user',0,'#0d9488,#6d28d9',11),
('np_graphite','nameplate','Graphite nameplate','Quiet metallic gradient behind your name.',5,'user',0,'#64748b,#1e293b',12),
('np_rose','nameplate','Rose nameplate','Soft pink gradient behind your name.',5,'user',0,'#db2777,#831843',13),
('fr_gold','frame','Gold avatar frame','A gold ring around your avatar.',10,'user',0,'#f5c542',20),
('fr_mint','frame','Mint avatar frame','A mint ring around your avatar.',10,'user',0,'#34d399',21),
('fr_violet','frame','Violet avatar frame','A violet ring around your avatar.',10,'user',0,'#a78bfa',22),
('up_25','boost','Upload boost +25 MB','Raises the upload limit by 25 MB for a server, your account, or a gift.',50,'any',25,'',30),
('up_45','boost','Upload boost +45 MB','Raises the upload limit by 45 MB for a server, your account, or a gift.',75,'any',45,'',31),
('up_65','boost','Upload boost +65 MB','Raises the upload limit by 65 MB for a server, your account, or a gift.',125,'any',65,'',32);
alter table bot_projects add column screen_status text not null default 'unscreened';
alter table bot_projects add column screen_score integer;
alter table bot_projects add column screen_uncertainty integer;
alter table bot_projects add column screen_report text;
alter table bot_projects add column screen_at integer;
update bot_projects set screen_status='legacy' where visibility='public';
create table bot_reviews(id text primary key,project_id text not null,actor_id text,kind text not null,status text not null,reason text not null default '',created_at integer not null);
create index bot_reviews_p on bot_reviews(project_id,created_at desc);
create index bot_projects_screen on bot_projects(screen_status,visibility);
create table program_feedback(id text primary key,server_id text not null,user_id text not null,text text not null,created_at integer not null);
create index program_feedback_s on program_feedback(server_id,created_at desc);
