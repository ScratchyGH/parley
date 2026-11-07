create table if not exists game_unlocks(user_id text not null,pack text not null,created_at integer not null,primary key(user_id,pack));
insert or ignore into game_unlocks(user_id,pack,created_at) select user_id,'hollow',created_at from par_tx where kind='refund' and ref='game_pack' and note='Refund: event games removed';
update users set pars=max(pars-25,0) where id in(select user_id from par_tx where kind='refund' and ref='game_pack' and note='Refund: event games removed');
delete from par_tx where kind='refund' and ref='game_pack' and note='Refund: event games removed';
