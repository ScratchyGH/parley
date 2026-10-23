alter table reports add column ai_verdict text;
alter table reports add column ai_category text;
alter table reports add column ai_severity integer;
alter table reports add column ai_conf integer;
alter table reports add column ai_note text;
alter table reports add column ai_action text;
alter table reports add column ai_at integer;
create index reports_ai on reports(status,ai_verdict,created_at desc);
