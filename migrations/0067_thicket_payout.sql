insert into par_owned(id,user_id,item_id,gift_from,created_at)
select 'po'||lower(hex(randomblob(8))),user_id,item_id,'event:thicket',(strftime('%s','now')*1000)
from(
select u.id user_id,i.id item_id,row_number() over(partition by u.id order by random()) rn,
(select count(*) from par_owned o where o.user_id=u.id and o.item_id in('bd_leaf','bd_feather','ti_grateful','bb_hearth','np_pie','nf_gold_leaf','ef_tk_steam','ef_tk_firefly','ef_tk_ember','fr_acornring','fr_maple','fr_wheat','fr_vine','fr_pilgrim','fr_candle','fr_foxhood','fr_antlers','fr_piecrust','fr_moon')) have
from users u join par_items i on i.id in('bd_leaf','bd_feather','ti_grateful','bb_hearth','np_pie','nf_gold_leaf','ef_tk_steam','ef_tk_firefly','ef_tk_ember','fr_acornring','fr_maple','fr_wheat','fr_vine','fr_pilgrim','fr_candle','fr_foxhood','fr_antlers','fr_piecrust','fr_moon')
where u.is_bot=0 and u.deleted_at is null
and not exists(select 1 from par_owned o2 where o2.user_id=u.id and o2.item_id=i.id)
)where rn<=6-have;
