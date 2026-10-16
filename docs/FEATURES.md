# Feature status

Verification levels used below:

- **API tested**: covered by `test/run.mjs` against a local `wrangler dev` (real WebSocket clients, local D1, R2 and Durable Object emulation).
- **UI written**: the browser client for it exists and passes static checks (`npm run test:static`, lint for undefined names), but **has never been run in a browser**. Expect bugs.
- **Untested**: written, with no test of any kind.
- **Missing**: does not exist. Not hidden behind a disabled button.

Nothing has been deployed to Cloudflare.

## Accounts

| Feature | Status |
| --- | --- |
| Register, login, logout, sessions list and revoke | API tested, UI written |
| Password change, recovery code reset and regeneration | API tested, UI written |
| Login lockout, registration rate limit | API tested |
| Profile (display name, pronouns, status, bio, avatar, banner, colour) | API tested, UI written |
| Account export (JSON) and deletion | API tested, UI written |
| Suspended account appeal page | API tested, UI written |
| Username protection: lookalike matching (case, dots, dashes, underscores, 0/o, 1/i/l, 5/s, 3/e, 4/a, 7/t, 8/b), reserved names, old names stay reserved for the previous owner (last 6 kept), deleted accounts keep their names reserved | API tested |
| Email verification, email based recovery | Missing |
| Two factor authentication (TOTP, 8 backup codes, login gate) | API tested; UI written. No QR code: the secret and an `otpauth://` link are shown |

## Servers, channels, roles

| Feature | Status |
| --- | --- |
| Create, edit, delete, transfer servers; icon, banner, accent, rules, welcome text | API tested, UI written |
| Text, announcement and voice channels; categories; reorder | API tested, UI written |
| Roles with a 16 bit permission field and hierarchy; escalation blocked | API tested, UI written |
| Per channel permission overrides (role and member) | API tested, UI written |
| Locked, read-only, slow mode | API tested, UI written |
| Invite links with expiry and use limits | API tested, UI written |
| Public discovery list with search and categories | API tested, UI written |
| Server activity numbers | API only, no UI |
| Threads from a message, forum channels with posts, polls (single/multi, timed, close), scheduled events with RSVP | API tested, UI written |
| Incoming webhooks (token shown once, posts as a bot user) | API tested, UI written |
| Bot accounts with tokens (REST only, no real-time gateway, limited endpoint allow list) | API tested, UI written |
| Bot projects: page with Markdown description, icon, up to 5 tags, SPDX license (or custom link), links, release notes, private / link-only / listed, add to server, install count | API tested, UI written, not seen in a browser |
| Bots hub: search, tag and license filters, sorting, creator editor with live listing preview | UI written, not seen in a browser |
| Outgoing webhooks and slash commands | Missing |

## Sign-in

| Feature | Status |
| --- | --- |
| Username and password, recovery code, TOTP | API tested |
| Sign in or link GitHub, Google or Discord (only offered when the matching `OAUTH_*` secrets are set) | API tested against a local fake provider only. Never run against the real services |
| Passkeys (WebAuthn, ES256, discoverable credentials, no attestation) | API tested with a software authenticator in Node. Never tried with a real browser or security key |
| Passwordless accounts can set a password later; the last sign-in method cannot be removed | API tested |

## Messaging

| Feature | Status |
| --- | --- |
| Send, edit, delete, reply, reactions, pins, saved messages | API tested, UI written |
| Mentions (users, roles by id, @everyone) with autocomplete and notification | API tested, UI written |
| Markdown, spoilers, code blocks with highlighting for common languages | Parser has 22 unit assertions (`test/md.mjs`, DOM stub); rendering in a browser untested |
| Attachments with progress and cancel, paste and drag and drop | API tested, UI written |
| Image, video, audio inline; other files as downloads | UI written |
| More file types: Office and OpenDocument files, archives, fonts, 3D models, MIDI, subtitles and many source formats (served as downloads or plain text with a Preview button up to 256 KB). Executables, HTML, SVG and XML stay blocked | API tested (mime, sniffing, download disposition), preview UI written |
| Link previews | API written, UI written; the fetch path is not covered by the test |
| Unread counts, mention badges, new messages divider, mark read | API tested, UI written |
| Typing indicators, presence | API tested, UI written |
| Search with filters (has attachment or link, pinned, scope) | API tested, UI written |
| Message forwarding (quoted text; attachments are not forwarded) | API tested, UI written |
| Custom server emoji (50 per server, 1 MB each) in messages, reactions and picker | API tested, UI written |
| Stickers: per-server (60) and personal (50), usable in any server or DM you are in, PNG/GIF/WebP up to 2 MB | API tested, UI written |
| GIF search | Missing. Every free GIF source needs a third-party API key and network access this project does not assume |
| Server signed messages (Ed25519, verifiable by clients) | API tested, verifier tested in Node |
| Image formats: JPEG, PNG, GIF, WebP, APNG, AVIF, JPEG XL, BMP, TIFF, ICO inline; HEIC stored as a download | Sniffing API tested; JXL and AVIF codecs round-trip tested in Node (`test/codec.mjs`). JXL lossless round trip is within plus or minus 1 per channel. Rendering in a browser untested |
| Client side image optimisation to WebP, AVIF or JXL before upload (off by default) | Codecs tested in Node; worker and UI written, never run in a browser |
| File storage: D1 chunk store by default (no R2, no card), spread across the main database and up to 8 extra D1 databases (`BLOB1` to `BLOB8`; 3 are configured). 25 MB per file, 100 MB per user. Cloudflare's free plan caps each D1 database at 500 MB and the whole account at 5 GB, so extra databases spread the load but do not raise the 5 GB total. Multipart upload with parallel parts, SHA-256 checked on completion. Optional R2 binding raises limits | API tested (D1 store); R2 path no longer covered by the test; client uploader never run in a browser |
| Drafts | Kept in this browser's localStorage |
| Avatar, banner, server icon and group icon crop dialog (drag and zoom, WebP output) | UI written, never run in a browser |
| Animated GIF, animated WebP and APNG avatars and banners (uploaded unmodified, up to 10 MB, never cropped or re-encoded) | Upload API tested with a GIF; animation display relies on the browser |
| Free "Nitro style" extras: custom emoji from any server you are in, animated emoji, 10,000 character messages, gradient profile colours, custom UI accent and background colours | API tested where it has an API; UI written |
| Message history is windowed (about 350 messages in the DOM), not a true virtual list | Design note |
| Optional external stores: Turso as the main database (auto schema), Supabase Storage and Firebase Firestore for files up to 16 MiB | Tested only against local stand-ins (API suite 311 checks through a Turso stand-in, `test/store.mjs` 17 checks). **Never run against the real services** |

## Direct messages and social

| Feature | Status |
| --- | --- |
| Friends, requests, blocks | API tested, UI written |
| 1:1 DMs, group DMs (up to 10), group rename, icon, members | API tested, UI written |
| Message requests from non friends with accept, decline, block | API tested, UI written |
| Privacy settings (who can DM, who can friend, hide presence) | API tested, UI written |

## Voice and video

| Feature | Status |
| --- | --- |
| Signaling through the Hub, join and leave, mute and deafen state, 12 per channel | API tested (signaling relay between real sockets) |
| WebRTC audio, camera, screen share, speaking indicator, device selection, push to talk, per user volume, connection quality | UI written. **No media has ever flowed in a test.** |
| TURN credentials from Cloudflare | API written; never run against Cloudflare. STUN fallback is used without secrets. |
| DM calls with ringing | API tested for ring events; media untested |
| Voice channel participant lists in the sidebar | UI written, shown for the server you are viewing only |
| SFU for large calls, recording, noise suppression beyond the browser's, soundboard, activities | Missing |

## Notifications

| Feature | Status |
| --- | --- |
| In-app inbox (mentions, friend requests) | API tested, UI written |
| Mute levels per server, channel and conversation | UI written |
| Sound and desktop notifications while a tab is open, do not disturb, quiet hours | UI written |
| Web Push when closed (VAPID, RFC 8291 encryption) | Payload encryption verified against an independent Node implementation (`test/push.mjs`). **Never delivered through a real push service.** Off unless `VAPID_PRIVATE_JWK` is set |
| Service worker for push display, web app manifest | Written, never run in a browser. No offline caching |
| Email notifications | Missing |

## Peer-to-peer layer

| Feature | Status |
| --- | --- |
| Engine: signalling through the Hub, WebRTC mesh with a control channel and 3 bulk channels per peer, binary framing, deflate for JSON | Tested in Node with an in-memory transport (`test/p2p.mjs`, 49 assertions). **The WebRTC transport (`rtc.js`) has never been run** |
| History addon: scrollback pages from peer caches, every message verified against the server Ed25519 key | Tested in Node |
| Swarm addon: 1 MiB segments from peers plus server range lanes, tail hedging, whole file SHA-256 check, server fallback, peer strikes | Tested in Node |
| Storage: IndexedDB with LRU eviction | Tested with fake-indexeddb |
| Settings UI and stats | Written, never run in a browser |

D1 and R2 remain authoritative. P2P is an optional accelerator and is off by default.

## Moderation and admin

| Feature | Status |
| --- | --- |
| Timeout, kick, ban, unban, audit log | API tested, UI written |
| Reports (message, user, server) and per server triage | API tested, UI written |
| Ban appeals | API tested, UI written |
| Global admin panel: stats, user search and suspension, reports, appeals, maintenance mode, audit log | API tested, UI written |
| AutoMod: blocked words, link blocking, mention limit (server side, on send and edit) | API tested, UI written |
| Raid protection: automatic 10 minute join lockdown above a joins-per-minute limit, manual lockdown | API tested, UI written |
| Vanity invite links (free) | API tested, UI written |
| Moderation notices to the affected user | Delivered live only if online; not stored |

## Safety and Experimental

- Explicit term filter for server, channel and category text, nightly purge of matching servers, admin sweep. Tested.
- 18+ Only servers with a self-declared Adult content switch. Tested.
- Explicit content scanner (links, redirects, page metadata, image classification), only enabled on 18+ servers. Link host matching and message removal are tested; page fetching and the Workers AI image model are not tested against real sites.
- Experimental settings tab (first user, `EXPERIMENTAL_USERNAMES`, admin toggle): AI Server Maker (Pollinations draft plus optional Puter refine, validated preview, add to a server), channel summariser, server health report, transcript export. Validation, apply, health and export are tested. Listing Pollinations models was checked against the live service; generating text needs a Pollinations API key (anonymous requests were refused when tried), and no successful generation or any Puter call has been run in this build.

## Interface

| Feature | Status |
| --- | --- |
| GitHub Dark Dimmed based theme, plus silver, light and high contrast | UI written |
| Density, font size, reduced motion | UI written |
| Responsive layout with drawers on narrow screens | UI written, no device testing |
| Keyboard shortcuts and quick switcher | UI written |
| Screen reader pass, full keyboard audit, localisation | Not done |

## Known limits

- The redesigned interface (Home overview, server cards, floating composer, new fonts) is verified only by static tests until looked at in a browser.

- Rate limiting is per isolate and best effort.
- Free-tier quotas cap how many people one deployment can serve; see ARCHITECTURE.md.
- Online presence is only known for people in the server or conversation you currently have open.
- Unread counts for servers you are not viewing refresh when you focus the tab and every three minutes, not instantly.
- Migrations are `0001_init.sql` to `0008_cleanup_indexes.sql` (0003: username claims, stickers, vanity, lockdown, bots; 0004: D1 file chunks; 0005: partial indexes for message lists, pins and spam checks; 0006: bot projects, tags, releases, installs; 0007: OAuth identities, passkeys, WebAuthn challenges; 0008: indexes for the nightly cleanup). Apply with `npm run migrate:remote` before deploying.
- Display names are not unique and are not protected, so someone can still copy another person's display name. Usernames (which are the unique handle) are protected.
- Full text search is still a LIKE scan: D1 FTS5 would roughly triple message write cost on the free plan.
- Not buildable on the free tier without a third party: email verification and recovery, end to end encryption, full text search, an SFU for large calls.
- HEIC/HEIF files are accepted and downloadable but not displayed inline.
