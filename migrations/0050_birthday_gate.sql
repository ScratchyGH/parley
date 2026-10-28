update par_items set enabled=0 where id in('np_bday','bd_bday','ef_bday','ti_bday');
update par_items set data='{"items":["np_bday","ef_bday","bd_bday","ti_bday"],"season":"bday13"}',enabled=1 where id='bn_bday';
