create index if not exists messages_live on messages(room,id) where deleted_at is null;
create index if not exists messages_author_room on messages(author_id,room,id);
create index if not exists messages_pinned on messages(room,id) where pinned=1;
analyze;
