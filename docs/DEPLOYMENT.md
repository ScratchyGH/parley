# Deployment

Nothing here has been run against a real Cloudflare account yet. Each step is what the tooling documents; treat the first deploy as the verification and report anything that differs.

## Requirements

- A Cloudflare account on the free plan
- Node.js 20 or newer
- This repository, with `npm install` done

## Cost warnings before you start

- Workers, D1 and Durable Objects stop working (they return errors) when their daily free allowance is used up. They reset at 00:00 UTC.
- Files are stored in D1 by default, sharded over `BLOB1`..`BLOB8` when those bindings exist (create each with `wrangler d1 create`, add a `[[d1_databases]]` block, never remove one that holds files; their table is created on first use), so R2 and a payment method are not needed. D1's free 5 GB is shared by messages and files, so keep `USER_QUOTA_MB` small. To use R2 instead, create a bucket and add `[[r2_buckets]] binding = "FILES" bucket_name = "..."` to `wrangler.toml`, then raise `MAX_UPLOAD_MB` and `MAX_FILE_MB`.
- **R2 (only if you add it) and Realtime TURN do not stop at their free allowance; usage above it is billed.** R2 free: 10 GB-month storage, 1M Class A and 10M Class B operations per month. TURN free: the first 1,000 GB, then $0.05 per GB. R2 may require a payment method on file to enable; I could not confirm this from Cloudflare's current documentation. Parley's per-user upload quota (`USER_QUOTA_MB`, default 500) and per-file limit (`MAX_UPLOAD_MB`, default 25) are guards, not a billing cap.
- Without TURN the app falls back to STUN only. Calls between some networks (symmetric NAT, strict corporate firewalls) will fail to connect.

## Optional external databases (all free, no card)

Cloudflare D1 is the default database and file store. Each of these is switched on by setting its secrets on the Worker (dashboard: Workers, parley, Settings, Variables and Secrets). Unset means unused. Add secrets yourself; never commit them.

| Service | Secrets | What it does | Free limits (check current terms) |
| --- | --- | --- | --- |
| Turso | `TURSO_URL` (`libsql://...`), `TURSO_TOKEN` | Replaces D1 as the main database. The schema is created automatically on first request. Also stores files. | about 5 GB. Every query becomes an internet round trip, so expect it to be slower than D1 |
| Supabase Storage | `SUPABASE_URL`, `SUPABASE_KEY` (service role key), optional `SUPABASE_BUCKET` (default `parley`, create it as a private bucket) | Stores files up to 16 MiB | about 1 GB, 50 MB per object |
| Firebase Firestore | `FIREBASE_SA` (the whole service account JSON, Firestore in Native mode on the free Spark plan) | Stores files up to 16 MiB in 512 KiB documents | about 1 GiB, 20k writes per day |

Files are placed on one of the configured stores by a hash of the file key, not by free space, and the store is recorded in the file's key. Switching Turso on does not move existing data from D1.

None of these three adapters has ever run against the real services. They are tested only against local stand-ins that follow each service's documented protocol (`npm run test:store`, and the API suite with `test/fakes.mjs`). Expect to debug the first real run.

## Steps

1. Sign in the CLI. This opens a browser for you to approve; do it yourself.

   ```
   npx wrangler login
   ```

2. Create the database and put its id in `wrangler.toml`.

   ```
   npx wrangler d1 create parley
   ```

   Add the printed `database_id = "..."` line under `[[d1_databases]]`. Recent Wrangler versions can also create bindings automatically on first deploy; that path has not been tried here.

3. Nothing to create for files: they use D1.

4. Apply the schema.

   ```
   npm run migrate:remote
   ```

5. Optional: voice relay. In the Cloudflare dashboard open Realtime, TURN, and create a key. Then:

   ```
   npx wrangler secret put TURN_KEY_ID
   npx wrangler secret put TURN_API_TOKEN
   ```

   Never commit these. `.dev.vars` is git-ignored for local use; `.dev.vars.example` lists the names.

6. Deploy.

   ```
   npm run deploy
   ```

7. Check it.

   ```
   curl https://<your-worker>.workers.dev/api/health
   ```

   Then open the URL, register, and keep the recovery code.

8. Make yourself an admin. Add your username to `ADMIN_USERNAMES` in `wrangler.toml` (comma separated), then `npm run deploy` again. The admin panel is in the status menu under your name.

## Optional sign-in providers

Each provider is offered on the sign-in screen only when both of its secrets exist. Register an OAuth app with the provider, set its callback (redirect) URL to `https://YOUR-HOST/api/auth/oauth/PROVIDER/callback`, then add the secrets on the Worker.

| Provider | Secrets | Scope requested | Callback path |
| --- | --- | --- | --- |
| GitHub | `OAUTH_GITHUB_ID`, `OAUTH_GITHUB_SECRET` | `read:user` | `/api/auth/oauth/github/callback` |
| Google | `OAUTH_GOOGLE_ID`, `OAUTH_GOOGLE_SECRET` | `openid profile` | `/api/auth/oauth/google/callback` |
| Discord | `OAUTH_DISCORD_ID`, `OAUTH_DISCORD_SECRET` | `identify` | `/api/auth/oauth/discord/callback` |

Only the provider's user id and display label are stored. These flows are tested against a local fake provider (`npm run test:signin` with the `.dev.vars.example` values pointed at it), not against GitHub, Google or Discord themselves, so expect to debug the first real run. Passkeys need no setup but only work on the exact host they were registered on.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `MAX_UPLOAD_MB` | 25 | Largest file sent in a single request (the free plan request body limit is 100 MB). |
| `MAX_FILE_MB` | 25 | Largest file via multipart upload (16 MiB parts). |
| `USER_QUOTA_MB` | 100 | Total attachment storage per user, including unfinished uploads. D1 free storage is 5 GB in total, shared with messages, so size this to your member count. |
| `PBKDF2_ITERS` | 100000 | Password hashing cost. 100,000 is the maximum Workers' WebCrypto accepts. Stored per hash. |
| `REGISTRATION_OPEN` | true | Set `"false"` to close signups. |
| `ADMIN_USERNAMES` | empty | Comma separated usernames that get the admin panel. |
| `EXPERIMENTAL_USERNAMES` | empty | Comma separated usernames that see the Experimental settings tab, in addition to the first account and anyone an admin enables. Set it as a plain variable in the Cloudflare dashboard. |

Secrets, all optional:

- `TURN_KEY_ID`, `TURN_API_TOKEN`: Cloudflare Realtime TURN.
- `SIGNING_JWK`: Ed25519 message signing key from `node scripts/gen-signing.mjs`. Without it a key is generated and kept in D1.
- `VAPID_PRIVATE_JWK`: from `node scripts/gen-vapid.mjs`; turns on Web Push. Optional variable `VAPID_SUBJECT` (a `mailto:` or https URL).

Set secrets with `wrangler secret put NAME`. Never commit them. Run `npm run migrate:remote` to apply the migrations (the Workers Builds deploy command does this for you). A cron trigger aborts multipart uploads left open for 24 hours.

## Deploying from GitHub

Two options:

- Cloudflare Workers Builds: connect the repository in the dashboard (Workers, your worker, Settings, Builds). Build command: none. Deploy command: `npx wrangler deploy`. Run `npm run migrate:remote` yourself when a release adds a migration.
- The included workflow `.github/workflows/deploy.yml` is manual (`workflow_dispatch`) and applies migrations and deploys. It needs repository secrets `CLOUDFLARE_API_TOKEN` (a token with Workers, D1 and R2 edit permission) and `CLOUDFLARE_ACCOUNT_ID`. It does nothing until you add them and run it.

## Custom domain

Add a route or custom domain to the worker in the dashboard. Cookies are `Secure` automatically on https, and WebSocket and API origin checks compare against the request's own origin, so no extra setting is needed.

## Troubleshooting

- **Voice connects but there is no audio between some people**: no TURN configured, or the secrets are wrong. `/api/rtc/ice` returns `turn: false` when it fell back to STUN.
- **Everyone gets errors late in the day**: a daily free quota was used up. The API reports database exhaustion as a 503 with a message. Check the dashboard for which one.
- **Registration or login is slow or fails with a CPU error**: PBKDF2 at 100,000 iterations may exceed the free plan's 10 ms CPU budget on some requests. This is untested on production. Options: lower `PBKDF2_ITERS` (weaker hashes, existing hashes keep their own count), or use the Workers Paid plan.
- **`npm test` fails with 429s**: you are hitting rate limits from repeated runs; wait a few minutes.
- **Uploads fail with 411**: a proxy removed the `Content-Length` header; uploads require it.

## Workers AI binding

`wrangler.toml` declares `[ai] binding = "AI"` for the image part of the explicit content scanner. Workers AI has a free daily allowance on the free plan. `wrangler dev` cannot start with that binding when you are not logged in to Cloudflare, so `npm run dev` writes a copy of the config without it (`wrangler.local.toml`, ignored by git) and the image check is simply off locally. To run the integration tests start the server with `npx wrangler dev -c wrangler.local.toml --port 8787 --test-scheduled`.
