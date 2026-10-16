create index if not exists sessions_exp on sessions(expires_at);
create index if not exists login_attempts_reset on login_attempts(reset_at);
create index if not exists uploads_created on uploads(created_at);
create index if not exists notif_created on notifications(created_at);
create index if not exists files_unattached on files(created_at) where message_id is null and kind='attachment';
create index if not exists invites_expiry on invites(expires_at) where expires_at is not null;
create index if not exists invites_revoked on invites(revoked) where revoked=1;
analyze;
