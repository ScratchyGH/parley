alter table users add column acard text;
alter table users add column ctitle text;
alter table users add column cmsg text;
insert or ignore into par_items(id,kind,name,descr,price,scope,mb,data,sort) values
('ac_banner','acard','Wide banner','Taller banner with the picture on the left.',10,'user',0,'',200),
('ac_center','acard','Centered','Large centered picture and name.',10,'user',0,'',201),
('ac_big','acard','Big picture','An extra large picture over the banner.',10,'user',0,'',202),
('ac_right','acard','Right aligned','Picture and name on the right.',10,'user',0,'',203),
('ac_square','acard','Squared','Square picture and sharp corners.',10,'user',0,'',204),
('ac_slim','acard','Slim','Short banner with a compact layout.',10,'user',0,'',205),
('ac_glass','acard','Glass','Frosted card over the banner.',10,'user',0,'',206),
('ac_float','acard','Floating','Picture floats beside the name.',10,'user',0,'',207),
('ac_poster','acard','Poster','Full height banner with text over it.',10,'user',0,'',208),
('ac_neon','acard','Neon edge','Glowing outline around the card.',10,'user',0,'',209),
('ac_ticket','acard','Ticket','Notched ticket shaped card.',10,'user',0,'',210),
('ac_mini','acard','Mini','Small card with a tiny banner.',10,'user',0,'',211),
('ef_static','effect','Static','White noise static over your picture.',12,'user',0,'',230),
('ef_staticc','effect','Color static','Colored noise static over your picture.',12,'user',0,'',231),
('ef_scan','effect','Scan static','Rolling scanlines with static.',12,'user',0,'',232),
('np_static','nameplate','Static plate','A plate of crawling white noise.',12,'user',0,'#6b7280,#111827',233),
('fr_static','frame','Static frame','A frame of buzzing static.',12,'user',0,'',234),
('nf_static','namefx','Static name','A name flickering with static.',10,'user',0,'',235),
('ti_static','title','Static title','A title that reads Static.',8,'user',0,'',236),
('bb_static','bubble','Static messages','Messages with a static edge.',10,'user',0,'',237),
('bn_static','bundle','Static bundle','Every static item: effects, plate, frame, name style, title and message style.',45,'user',0,'{"items":["ef_static","ef_staticc","ef_scan","np_static","fr_static","nf_static","ti_static","bb_static"]}',238),
('ctitle','unlock','Custom title','Write your own title and pick its colour.',15,'user',0,'',240),
('cmsg','unlock','Custom message style','Pick a message style and an optional highlight colour.',15,'user',0,'',241);
