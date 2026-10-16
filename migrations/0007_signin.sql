create table oauth_identities(
provider text not null,
subject text not null,
user_id text not null,
label text not null default '',
created_at integer not null,
primary key(provider,subject)
) without rowid;
create index oauth_identities_u on oauth_identities(user_id);
create table passkeys(
id text primary key,
user_id text not null,
pub text not null,
counter integer not null default 0,
name text not null default 'Passkey',
created_at integer not null,
last_used integer
);
create index passkeys_u on passkeys(user_id);
create table webauthn_challenges(
id text primary key,
user_id text,
kind text not null,
expires_at integer not null
);
create index webauthn_challenges_exp on webauthn_challenges(expires_at);
