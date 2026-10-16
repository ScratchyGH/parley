create index if not exists read_state_room on read_state(room);
create index if not exists saved_msg on saved(message_id);
create index if not exists categories_server on categories(server_id,position);
create index if not exists blocks_blocked on blocks(blocked_id);
create index if not exists member_roles_user on member_roles(user_id);
create index if not exists users_bot_owner on users(bot_owner) where bot_owner is not null;
create index if not exists files_server on files(server_id) where server_id is not null;
create index if not exists servers_owner on servers(owner_id);
create index if not exists overrides_target on overrides(target_type,target_id);
