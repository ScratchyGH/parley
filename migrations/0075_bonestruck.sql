update par_items set name='Bone thorn frame',descr='A frame of bone and thorns with a skeletal hand and a fanged skull. Only in the Bonestruck bundle.' where id='fr_trex';
update par_items set descr='A cold grey glow and a ring of thorns that slowly turns around your avatar. Only in the Bonestruck bundle.' where id='ef_trex';
update par_items set descr='Dark steel with a jagged edge and a blood red stripe. Only in the Bonestruck bundle.' where id='np_trex';
update par_items set descr='Letters that shimmer from bone white to blood red. Only in the Bonestruck bundle.' where id='nf_trex';
update par_items set descr='A skull next to your name. Only in the Bonestruck bundle.' where id='bd_trex';
update par_items set name='Bonestruck title',descr='Shows "Bonestruck" next to your name. Only in the Bonestruck bundle.' where id='ti_trex';
update par_items set descr='Messages get a grey edge with a blood red slash. Only in the Bonestruck bundle.' where id='bb_trex';
update par_items set name='Bonestruck bundle',descr='A frame of bone and thorns with a skeletal hand and a fanged skull, a cold glow with turning thorns, a bone nameplate, a pale name, a badge, a title, a message style and a 3 month vanity link.',data=json_set(data,'$.variants.main.label','Bonestruck') where id='bn_trex';
