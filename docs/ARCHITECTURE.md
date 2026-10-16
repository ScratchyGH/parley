# Architecture

## Layout

```
src/            Worker (API, auth, permissions, WebSocket entry) and the Hub Durable Object
migrations/     D1 schema
public/         Static client: index.html, style.css, js/ (ES modules, no build step)
test/           run.mjs (backend integration), static.mjs (client static checks)
```

Requests to `/api/*` and `/ws` run the Worker first. Everything else is served from static assets with a single page app fallback.

## Rooms and the Hub

One Durable Object class (`Hub`) holds WebSockets. A hub is addressed by name:

| Name | Holds | Used for |
| --- | --- | --- |
| `u_<userId>` | one user's sockets | direct message delivery, notifications, read sync, friend and account events |
| `s_<serverId>` | everyone currently viewing that server | channel messages, typing, presence, voice state and signaling |
| `cv_<id>` | members viewing that conversation | typing, DM call signaling |

The client opens only the sockets it needs: its own `u_` room, the active server or conversation, and the room of any voice call. Opening a server therefore costs one socket, not one per server.

Per-user channel access (`view` and `connect` lists) is computed at connect time by the Worker and stored in the Hub. Events carry a channel id and are only sent to sockets whose list contains it. When roles, overrides or membership change, the Worker closes the affected sockets with code 4001 and clients reconnect and resync.

Typing and presence are held in memory by the Hub and never touch D1. Only voice participant state is persisted in the Hub's storage.

## Permissions

A 16 bit field per role: view, send, manage messages, manage channels, manage roles, create invites, kick, ban, manage server, moderate, connect, manage voice, attach, react, mention everyone, administrator. A member's base permissions are the union of @everyone and their roles. Channel overrides apply in this order: @everyone, roles, the member. Locked, read-only and announcement channels strip send, and a timeout reduces a member to view only. Role hierarchy is by position; granting is limited to a subset of the actor's own permissions, and only an administrator may grant administrator.

## Voice, video, screen share

Signaling goes through the server Hub (`voice.join`, `voice.leave`, `voice.state`, `sig`) and is relayed only between participants in the same channel. Media is a full mesh of RTCPeerConnections using perfect negotiation, so each participant uploads one copy per peer. The limit is 12 per channel, and in practice video quality will degrade well before that on ordinary uplinks. There is no SFU.

## Messages

Ids are time sortable strings. A unique `(author, nonce)` makes sends idempotent so retries cannot duplicate. Deletes are soft. Search is a `LIKE` scan restricted to rooms the user can read: there is no full text index, to save D1 writes. Unread state is `channels.last_msg` compared with a per-user `read_state` row.

## Peer-to-peer layer

`public/js/p2p/` holds a core engine and two addons. The Hub relays `p2p.join`, `p2p.leave` and `p2p.sig` between sockets that can both view a channel; it never carries message or file data for P2P. Each peer pair uses one WebRTC connection with a control data channel and three bulk channels. Frames are binary: JSON, deflated JSON, or 16 KiB chunks.

- `hist` answers history page requests from a local store. Each message is checked against the server's Ed25519 public key (`GET /api/p2p/key`) and the page must form a contiguous segment, otherwise the client asks the server.
- `swarm` downloads files in 1 MiB segments from peers and server range requests in parallel, hedges the slowest segments, verifies the whole-file SHA-256 (the server records it at upload time) and falls back to the server on mismatch, striking the peer.
- Storage is IndexedDB with LRU eviction, or memory.

D1 and R2 stay authoritative, so a deployment with no peers behaves exactly as before.

## Media pipeline

Uploads under 100 MB are one request with an `x-sha256` header that R2 verifies. Larger files use `init`, parallel `part` PUTs and `complete`. JPEG XL and AVIF encode and decode run in a module Web Worker with vendored single-threaded WebAssembly codecs (`public/vendor/codecs`, Apache-2.0, from jSquash). Native decoders are used when the browser has them.

## Client

Plain ES modules. The DOM is built with a small `h()` helper that never parses HTML. Message text is parsed by `md.js` into DOM nodes (links limited to http and https, no raw HTML, bounded recursion), so there is no `innerHTML` in the client. The message list keeps a window of at most about 350 messages in the DOM and pages older and newer messages as you scroll.

## Free-tier budget

Limits taken from Cloudflare's documentation in October 2026. Verify before relying on them.

| Resource | Free allowance |
| --- | --- |
| Worker requests | 100,000 per day |
| CPU per request | 10 ms |
| Subrequests per request | 50 |
| D1 rows read | 5 million per day |
| D1 rows written | 100,000 per day |
| D1 storage | 5 GB total, 500 MB per database |
| D1 bound parameters per query | 100 |
| Durable Object requests | 100,000 per day (incoming WebSocket messages count 1 per 20) |
| Durable Object duration | 13,000 GB-s per day |
| R2 | 10 GB-month, 1M Class A and 10M Class B operations per month, free egress; billed above this |
| Realtime TURN | first 1,000 GB then $0.05 per GB; STUN is free |

Daily limits reset at 00:00 UTC. When D1 or the Workers request allowance is exhausted, calls fail until the reset.

What this means, as estimates and not measurements: the binding limit is Worker requests. Each sent message is one request, and each page load and each reconnect adds several; the client also polls `/api/unread` every three minutes while a tab is visible, so a user who leaves a tab open costs about 480 requests a day by itself. Expect the free plan to support a small community, in the tens of regular users, not thousands. Run it for a few days and read the dashboard before inviting more people. Paid plans lift every one of these limits without code changes.

Costs avoided on purpose: no polling for messages (WebSockets), no FTS tables (fewer D1 writes), ephemeral state in memory, no image proxy, link previews cached, and notifications only for mentions and direct messages.
