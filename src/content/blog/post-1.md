---
title: "Building an On-Chain Liquidation Bot on Solana"
meta_title: "Building an On-Chain Liquidation Bot on Solana"
description: "What I learned building a liquidation monitor that watches borrowers and executes on-chain when health factors drop."
date: 2025-04-15T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["DeFi", "Solana"]
author: "auntiehomie"
tags: ["solana", "defi", "typescript", "bots"]
draft: false
---

Building the liquidation bot taught me more about on-chain state than any tutorial could.

The core challenge isn't the liquidation itself — it's the monitoring. You have to keep a live view of every borrower's health factor across a protocol, react in milliseconds when one drops below threshold, and execute atomically before anyone else does.

## What I Built

The bot monitors borrower positions on a DeFi lending protocol, calculates health factors in real time, and submits liquidation transactions when a position becomes eligible. It handles slippage, gas estimation, and MEV-awareness.

## The Hard Parts

**RPC reliability** — a single RPC endpoint will let you down at the worst moment. Running multiple endpoints with automatic failover is non-negotiable.

**Ordering** — the mempool is adversarial. By the time your tx lands, someone else may have already liquidated the position. Tracking what's in-flight and gracefully handling failed liquidations matters more than raw speed.

**Health factor math** — every protocol does it slightly differently. Reading the smart contract source directly rather than relying on SDK abstractions saved me a lot of subtle bugs.

## Lessons

Start with a read-only monitor that just logs eligible positions before you touch execution. It's boring, but it's how you validate your math before real money is at risk.

Full source on [GitHub](https://github.com/auntiehomie/liquidation-bot).
