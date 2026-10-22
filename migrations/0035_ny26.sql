insert or replace into par_items(id,kind,name,descr,price,scope,mb,data,sort,enabled) values
('fr_ny26','frame','Countdown frame','A navy and gold ring of stars, streamers and confetti with 2026 on top. Only in the New Years 2026 bundle.',40,'user',0,'',400,0),
('ef_ny26','effect','Party glasses effect','Gold 20-26 party glasses with a glint across your eyes and a party hat on top. Only in the New Years 2026 bundle.',30,'user',0,'',401,0),
('np_ny26','nameplate','Midnight Party nameplate','Navy and gold with sparkling confetti. Only in the New Years 2026 bundle.',30,'user',0,'',402,0),
('nf_ny26','namefx','Party name','Letters that shimmer through gold, pink and blue. Only in the New Years 2026 bundle.',16,'user',0,'',403,0),
('bd_ny26','badge','Party popper badge','A party popper next to your name. Only in the New Years 2026 bundle.',10,'user',0,'',404,0),
('bd_ny262','badge','2026 badge','A gold 26 medal next to your name. Only in the New Years 2026 bundle.',10,'user',0,'',405,0),
('ti_ny26','title','Cheers 2026 title','Shows "Cheers 2026" next to your name. Only in the New Years 2026 bundle.',10,'user',0,'',406,0),
('bb_ny26','bubble','Party message style','Messages get a gold edge and confetti. Only in the New Years 2026 bundle.',14,'user',0,'',407,0),
('bn_ny26','bundle','New Years 2026 bundle','Limited time, New Years Eve only. Gold 20-26 party glasses and a party hat, a countdown frame with confetti, a nameplate, a shimmering name, two badges, a title and a message style.',141,'any',0,'{"variants":{"main":{"label":"New Years 2026","items":["fr_ny26","ef_ny26","np_ny26","nf_ny26","bd_ny26","bd_ny262","ti_ny26","bb_ny26"],"vanity_days":0,"price":141,"gift_price":127,"server_price":0}},"limited":true,"season":"ny26"}',2,1);
update par_items set name='Bloodshot frame',descr='Twelve bloodshot eyes that stare, dilate and blink, with blood dripping down. Only in the Spooked Out bundle.' where id='fr_spook';
update par_items set name='Bats effect',descr='Red-eyed bats swarming around your avatar. Only in the Spooked Out bundle.' where id='ef_spook';
update par_items set name='Wraith effect',descr='Hollow-eyed wraiths drifting beside your avatar. Only in the Spooked Out bundle.' where id='ef_spook2';
update par_items set name='Bloodstained nameplate',descr='Black and crimson with dripping blood. Only in the Spooked Out bundle.' where id='np_spook';
update par_items set name='Bleeding name',descr='Letters that glitch through blood red. Only in the Spooked Out bundle.' where id='nf_spook';
update par_items set name='Red-eyed bat badge',descr='A bat with glowing red eyes and fangs. Only in the Spooked Out bundle.' where id='bd_spook';
update par_items set name='Wicked jack-o''-lantern badge',descr='A carved pumpkin with a sinister grin. Only in the Spooked Out bundle.' where id='bd_spook2';
update par_items set name='Nightmare title',descr='Shows "Nightmare" next to your name. Only in the Spooked Out bundle.' where id='ti_spook';
update par_items set name='Bloody message style',descr='Messages get a blood-dripping edge. Only in the Spooked Out bundle.' where id='bb_spook';
update par_items set descr='Limited time. Twelve bloodshot eyes that stare and blink while blood drips, red-eyed bats, wraiths, a bloodstained nameplate, a bleeding name, two badges, a title and a message style.' where id='bn_spook';
delete from par_owned where item_id in ('fr_arcade','ef_arcade','np_arcade','nf_arcade','bd_arcade','ti_arcade','bb_arcade') or item_id like 'bundle:bn_arcade%';
delete from par_items where id in ('fr_arcade','ef_arcade','np_arcade','nf_arcade','bd_arcade','ti_arcade','bb_arcade','bn_arcade');
update par_items set data='{"variants":{"main":{"label":"Timeskipper","items":["fr_time","ef_time","np_time","nf_time","bd_time","ti_time","bb_time"],"vanity_days":365,"price":168,"gift_price":151,"server_price":122}},"limited":true,"season":"time"}' where id='bn_time';
