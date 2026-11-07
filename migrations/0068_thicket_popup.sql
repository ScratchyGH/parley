insert into gift_inbox(id,user_id,from_name,kind,item_id,label,amount,created_at)
select 'gf'||lower(hex(randomblob(8))),user_id,'Parley','multi',group_concat(item_id),'Thankful Thicket rewards',0,strftime('%s','now')*1000
from par_owned where gift_from='event:thicket' and created_at%1000=0 and created_at>=1794078000000
group by user_id;
