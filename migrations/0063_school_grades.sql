insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('ef_school_f','effect','Grade F badge','A grade F stamp on your avatar. Only in the Back to School bundle.',30,'user',0,'',368,0),
('ef_school_d','effect','Grade D badge','A grade D stamp on your avatar. Only in the Back to School bundle.',30,'user',0,'',369,0),
('ef_school_c','effect','Grade C badge','A grade C stamp on your avatar. Only in the Back to School bundle.',30,'user',0,'',370,0),
('ef_school_b','effect','Grade B badge','A grade B stamp on your avatar. Only in the Back to School bundle.',30,'user',0,'',371,0),
('ef_school_a','effect','Grade A badge','A grade A stamp on your avatar. Only in the Back to School bundle.',30,'user',0,'',372,0);
update par_items set name='Grade A+ badge',descr='An A+ stamp on your avatar. Only in the Back to School bundle.' where id='ef_school';
update par_items set data=replace(data,'["fr_school","ef_school","np_school"','["fr_school","ef_school","ef_school_a","ef_school_b","ef_school_c","ef_school_d","ef_school_f","np_school"'),descr='Limited time. A pencil frame, a choice of grade badges from F to A+, chalkboard nameplate, name style, apple badge, title and notebook message style.' where id='bn_school';
insert into par_owned(id,user_id,item_id,server_id,gift_from,created_at) select 'po'||lower(hex(randomblob(8))),o.user_id,g.id,null,'bundle:bn_school',strftime('%s','now')*1000 from (select distinct user_id from par_owned where item_id='ef_school') o, (select 'ef_school_a' id union all select 'ef_school_b' union all select 'ef_school_c' union all select 'ef_school_d' union all select 'ef_school_f') g;
