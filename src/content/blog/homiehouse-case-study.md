---
title: "Homiehouse: Migrating from Neynar to Open Farcaster Infrastructure"
meta_title: "Homiehouse Case Study — Neynar Migration to Pinata/HyperSync"
description: "How we replaced a proprietary Farcaster API with open alternatives — saving costs, removing dependencies, and keeping zero downtime."
date: 2026-06-19T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["Case Study", "Infrastructure", "Web3"]
author: "Amanda"
tags: ["homiehouse", "farcaster", "neynar", "migration", "case-study"]
draft: false
---

## Problem

Homiehouse started as a Farcaster client — a social feed with cast search, notifications, and channel browsing. In early development, the natural choice was the **Neynar SDK**: it was well-documented, covered all the endpoints we needed, and got us to MVP fast.

But as the project matured, three issues emerged:

**1. API costs.** Neynar's pricing scales with usage. For a bootstrapped project, every API call eats into runway. The cast search and notification endpoints that Homiehouse hits most frequently also happen to be the most expensive.

**2. Vendor lock-in.** The entire cast search, notification, and token data pipeline depended on a single provider. If Neynar changed pricing, deprecated an endpoint, or went down, Homiehouse went with it.

**3. SDK churn.** Neynar's SDK evolved fast. Every update risked breaking the shim layer we'd built around it. The maintenance tax was real for a small team.

The challenge: **migrate to open, cheaper alternatives without breaking anything for users.**

---

## Action

### Step 1: Auditing Every Neynar Dependency

We flagged every file in the codebase that imported the Neynar SDK. The dependencies fell into three categories:

- **Cast operations** (fetch cast, publish cast, search casts)
- **Notification polling** (fetch notifications for the bot)
- **Token data** (token prices, metadata)
- **Signer registration** (Warpcast signer key generation)

For each, we identified an open alternative.

### Step 2: Replacing API by API

**Cast operations → Pinata + HyperSync.** Pinata's Farcaster API covers fetchCast and publishCast with a cleaner interface and no per-call costs. For cast search, we added a HyperSync fallback — `searchSimilarCasts()` now calls `searchCasts()` via HyperSync when available.

**Notification polling → Pinata.** The bot's `/api/bot/check` route was migrated from `neynar.fetchNotifications()` to Pinata's equivalent. One file, one swap, zero downstream impact.

**Token data → DexScreener.** Neynar removed their fungibles endpoint mid-project. Rather than scrambling for a replacement mid-crisis, we preemptively migrated to DexScreener's API — more data, less cost, no dependency anxiety.

**Signer registration → Direct Warpcast API.** This was the trickiest. The original flow used `neynar.registerSignedKey()`. We replaced it with direct calls to the Warpcast signed-key-requests endpoint, using `@noble/curves` Ed25519 for key generation and EIP-712 for signature encoding. More code, but zero API dependency for the core auth flow.

### Step 3: The Shim Pattern

Rather than ripping out `neynar.ts` entirely, we turned it into a **compatibility shim** — the same exports, the same function signatures, but backed by Pinata and HyperSync under the hood. The rest of the codebase didn't need to change. No cascading refactors, no regressions.

```typescript
// Before
import { neynarFetch } from '@neynar/nodejs-sdk';

// After
import { neynarFetch } from './neynar'; // same API, new internals
```

### Step 4: Smoke Testing

The migration landed with a `scripts/smoke-test.ts` script that hits `/api/healthcheck`, `/api/notifications`, and the homepage — asserting 200 responses for each. We ran it against production after every deployment.

---

## Result

- **Zero API costs** for core Farcaster operations (cast reads, notifications, search)
- **Zero downtime** during migration — users never noticed the switch
- **Cleaner architecture** — one less third-party dependency, one less API key to rotate
- **Future-proofed** — Pinata, HyperSync, and DexScreener all have free tiers and open documentation. Switching providers again would take hours, not weeks.

The migration confirmed a lesson I keep learning: **start with the fastest path to MVP, but design so you can replace any component without rewriting the whole system.**

*Homiehouse is live at [homiehouse.vercel.app](https://homiehouse.vercel.app) and open source on [GitHub](https://github.com/auntiehomie/homiehouse).*