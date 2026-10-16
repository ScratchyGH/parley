# Parley

A chat platform for communities: servers with channels and roles, direct messages and group chats, and WebRTC voice, video and screen sharing. It is built to run on Cloudflare's free plan with no paid dependencies.

Status: **pre-release (0.1.0)**. The backend has an automated integration test (311 assertions, run against a local `wrangler dev`), plus Node tests for the markdown parser, push encryption, image codecs and the peer-to-peer engine. The browser client is written but has **not been exercised in a real browser**, and **nothing has been deployed**. See [docs/FEATURES.md](docs/FEATURES.md) for an item-by-item account of what exists, what was verified and what is missing.

## What it runs on

| Part | Service |
| --- | --- |
| API and static client | Cloudflare Workers with static assets |
| Data | D1 (SQLite), or Turso (optional) |
| Realtime (messages, typing, presence, voice signaling) | One Durable Object class using the WebSocket Hibernation API |
| Attachments | D1 chunk store; optional Supabase Storage and Firebase Firestore |
| Voice, video, screen share | Browser WebRTC, peer to peer mesh (max 12 per channel), optional Cloudflare Realtime TURN |
| Optional P2P acceleration | WebRTC data channels (history and file segments), verified by server signatures and SHA-256 |
| Images | Vendored WebAssembly JPEG XL and AVIF codecs in a Web Worker |
| Frontend | Plain ES modules, no build step, no framework, no runtime dependencies |

Free-tier limits are real and finite. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#free-tier-budget) before inviting people.

## Quick start (local)

```
npm install
npm run migrate:local
npm run dev
```

Open http://127.0.0.1:8787, create an account, and **save the recovery code** shown once at signup. There is no email: the code is the only way to reset a forgotten password.

Tests:

```
npm run test:static   # client module graph, CSP and unsafe-API checks, Markdown, push, codec and P2P engine tests; no server or browser needed
npm test              # backend integration test; needs `npm run dev` running; takes about a minute
```

Do not run `npm test` against a deployed instance: it creates many accounts and trips rate limits on purpose.

## Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documents

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Cloudflare setup, secrets, GitHub deploys, troubleshooting
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): design, rooms, permission model, free-tier budget
- [docs/SECURITY.md](docs/SECURITY.md): what is protected and how, and what is not
- [docs/FEATURES.md](docs/FEATURES.md): feature status, verification status, known gaps

## License

MIT

## Look

Default theme is Deep Fjord (`#212829`) with Midnight Merlot (`#521525`) as the accent fill. Merlot alone is too dark to read as text or focus outlines on that background, so a lighter tint of it is used for those. Users can override both colours in settings.

## Third-party code

`public/vendor/codecs` contains prebuilt single-threaded WebAssembly JPEG XL and AVIF encoders and decoders from [jSquash](https://github.com/jamsinclair/jSquash) (Apache-2.0, see `public/vendor/codecs/LICENSE.jsquash`). There are no other runtime dependencies.
