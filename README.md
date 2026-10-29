# Parley

A free-hosted Discord alternative that runs entirely on Cloudflare. Servers with channels, roles and stages, direct messages and group chats, voice, video and screen sharing, a Pars shop of cosmetics, and Bot Lab, a no-code block editor for building bots.

Live: https://parley.heavengtwashere.workers.dev

Downloads for Windows, Mac, Linux and Android are on the site's download page. Release notes are in the app under What's new.

## What is in it

- **Chat**: servers, channels, threads, roles and permissions, replies, reactions, polls, stickers, GIFs, scheduled messages, message formatting, link previews and file uploads.
- **Slash commands**: type `/` for built-in commands and every command from the bots in the server. Bot commands can ask for text, numbers, yes or no, or a choice from a list.
- **Voice and video**: browser WebRTC calls, screen sharing, stages and group calls, with optional Cloudflare TURN.
- **Direct messages and friends**, notifications and web push.
- **Accounts**: password with a recovery code, optional email for password resets and security alerts, two-factor codes, passkeys, GitHub, Google and Discord sign-in, and several accounts on one device.
- **Bot Lab**: 284 blocks across triggers, logic, actions, moderation, data, DiscordDirect (works with Discord with no bot), real-world data, text, math and date labs, robotics, device, Bluetooth and hardware. 64 ready-made API services, an RSS and page preview reader, templates, test runs and sharing.
- **Moderation**: cases, timeouts, bans, auto moderation, safety filters, audit log and an admin panel.
- **Pars shop**: cosmetic frames, effects, nameplates, name styles, badges, bundles and gifting.
- **Servers extras**: plugins, backups, server labs and the Parley Community server every account joins.
- **Optional P2P layer**: WebRTC data channels for history and file segments, verified by server signatures and SHA-256.

## What it runs on

| Part | Service |
| --- | --- |
| API and static client | Cloudflare Workers with static assets |
| Data | D1 (SQLite), with extra D1 databases for file chunks. Turso, Supabase Storage and Firebase are optional |
| Realtime | One Durable Object class using the WebSocket Hibernation API |
| AI features | Workers AI |
| Voice, video, screen share | Browser WebRTC mesh, optional Cloudflare Realtime TURN |
| Email | Resend, optional |
| Images | Vendored WebAssembly JPEG XL and AVIF codecs in a Web Worker |
| Frontend | Plain ES modules, no build step, no framework, no runtime dependencies |
| Apps | Electron desktop builds and an Android app, built by GitHub Actions |

Free-tier limits are real and finite. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#free-tier-budget) before inviting people.

## Quick start (local)

```
npm install
npm run migrate:local
npm run dev
```

Open http://127.0.0.1:8787, create an account, and save the recovery code shown once at signup. Add an email in Settings to reset a forgotten password by email as well.

Tests:

```
npm run test:static   # client module graph, CSP checks, Markdown, slash, push, codec and P2P tests; no server needed
npm run test:signin   # OAuth and passkey flows against a fake provider
npm test              # backend integration test; needs `npm run dev` running
```

Do not run `npm test` against a deployed instance: it creates many accounts and trips rate limits on purpose.

## Deploy

Pushes to the main branch deploy through Cloudflare. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for setup, secrets and the optional services. To send email, set the `RESEND_API_KEY` secret and optionally a `MAIL_FROM` variable such as `Parley <no-reply@example.com>`.

## Documents

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Cloudflare setup, secrets, GitHub deploys, troubleshooting
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): design, rooms, permission model, free-tier budget
- [docs/SECURITY.md](docs/SECURITY.md): what is protected and how
- [docs/FEATURES.md](docs/FEATURES.md): feature status and known gaps

## Look

Default theme is Deep Fjord (`#212829`) with Midnight Merlot (`#521525`) as the accent fill, with a lighter tint of Merlot for text and focus outlines. Themes, fonts and cosmetics persist per account.

## Third-party code

`public/vendor/codecs` contains prebuilt single-threaded WebAssembly JPEG XL and AVIF encoders and decoders from [jSquash](https://github.com/jamsinclair/jSquash) (Apache-2.0).

## License

MIT
