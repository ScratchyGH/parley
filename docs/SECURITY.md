# Security notes

This is a description of what the code does, not a certification. It has not been independently reviewed or penetration tested.

## Accounts and sessions

- Passwords: PBKDF2-SHA256, random 16 byte salt per user, 100,000 iterations stored with each hash. That is the platform maximum for Workers' WebCrypto and is below current general guidance for PBKDF2 (hundreds of thousands). Use long passwords; minimum length is 10. Verification is constant time.
- Sessions: a random 32 byte token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` on https). Only its SHA-256 is stored, so a database leak does not yield usable sessions. Sessions expire after 30 days of inactivity and can be listed and revoked. Changing the password or using recovery signs out other sessions.
- Login throttling: 8 failed attempts per username and 40 per address in 15 minutes lock further attempts. Unknown usernames take the same code path, so timing does not reveal which usernames exist.
- Recovery: there is no email. Each account has a one time recovery code, shown once, stored only as a hash, replaced after each use. Losing both the password and the code means losing the account.
- Account deletion anonymises the user and requires the password. Servers you own must be transferred or deleted first.

## Requests

- CSRF: state changing requests must carry a same origin `Origin`, or a `Sec-Fetch-Site` of `same-origin` or `none`. The WebSocket upgrade checks `Origin`.
- Input is validated for type, length and range on the server. Settings use a whitelist.
- Content Security Policy for the client: `script-src 'self'`, `style-src 'self'`, no inline script or style, `frame-ancestors 'none'`, `object-src 'none'`. The client contains no `innerHTML`, `eval` or inline handlers; `npm run test:static` fails if one is added.
- Rate limits are token buckets kept in each Worker isolate's memory. **They are best effort**: separate isolates do not share counters, so a determined client can exceed them. Login lockout is stored in D1 and is exact.

## Messages and files

- Message text is rendered by a parser that produces DOM nodes. Links are limited to http and https without embedded credentials, and open with `noopener noreferrer nofollow`.
- Uploads: size checked from `Content-Length` before reading, content sniffed by magic bytes, executable and script extensions refused (`exe`, `svg`, `html` and others), and only images, audio, video and PDF are served inline. Everything else downloads. Files are served from the API origin through an authorisation check with a sandboxing CSP, never from a public bucket URL. Avatars, banners and server and group icons are readable without signing in by anyone who knows the file id (random, unguessable, but not secret once shared) and are cached for a day. Attachments require a signed in user with access to the room.
- Link previews are fetched by the server. Hosts that are `localhost`, internal names, IP literals or without a dot are refused, only http and https are allowed, and images are never proxied. This is a blocklist, not a full SSRF defence: Workers cannot reach private networks, which is the main protection.

## Signing, 2FA and push

- Messages are signed on the server with Ed25519 (canonical string `p1\n id room author created edited content`). The key is the `SIGNING_JWK` secret if set, otherwise generated and stored in D1, which means the database holder also holds the key. Clients use the signature only to detect tampering by peers, not to prove authorship against the operator.
- TOTP secrets are stored in D1 in the clear (the server must read them to verify). Backup codes are stored as SHA-256 hashes and are single use.
- Web Push payloads are encrypted to the subscribing browser (RFC 8291); the push service sees only ciphertext and metadata.

## Privacy

- **Messages are not end to end encrypted.** They are stored in plaintext in D1, and the person who operates the deployment can read them. Direct messages are visible to the operator too.
- With P2P enabled, cached message history and file segments are shared with peers who can view the same channel. Relay-only mode needs a TURN server.
- Voice and video are peer to peer, encrypted by WebRTC (DTLS-SRTP). Peers see each other's IP addresses unless the call is relayed through TURN.
- Presence can be hidden in settings (applies to connections made after the change). Blocking prevents new direct messages and calls from that user.
- The server stores the user agent and a truncated IP for each session, to display in the session list.

## Abuse controls

Reports (messages, users, servers), per server moderation (timeout, kick, ban, audit log, ban appeals), a global admin panel (suspend users, maintenance mode, global audit log), slow mode, a duplicate message check, message request limits for non friends, and per user storage quota.

## Known weaknesses

- Best effort rate limiting (above).
- PBKDF2 iteration count (above), and its CPU cost on the free plan is unverified in production.
- No email verification, so nothing stops one person from making many accounts except per address registration limits.
- Two factor authentication is TOTP only. A lost authenticator plus lost backup codes means the account cannot be recovered by the recovery code.
- Peer-to-peer mode (off by default) reveals your IP address to peers over WebRTC. Peers can withhold messages from history pages, and a page may contain messages that were deleted while that peer was offline, until you refresh from the server. Files fetched from peers are verified by SHA-256 and messages by the server signature, so peers cannot forge content, only omit it.
- Webhook tokens are stored hashed but anyone holding the URL can post as that webhook.
- Push, the service worker and all new client code have not been run in a browser or against a real push service.
- No content scanning of uploads.
- The client has not been browser tested; there may be UI bugs with security relevance that static checks cannot find.

## Reporting a vulnerability

Open a private security advisory on the repository. Do not post details in a public issue.
