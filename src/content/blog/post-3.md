---
title: "MEV on Solana: What's Different from Ethereum"
meta_title: "MEV on Solana: What's Different from Ethereum"
description: "A quick breakdown of how miner/validator extractable value works differently on Solana vs Ethereum, from someone who had to learn it the hard way."
date: 2025-05-01T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["DeFi", "Solana"]
author: "auntiehomie"
tags: ["solana", "mev", "defi", "ethereum"]
draft: false
---

Coming from Ethereum MEV research, Solana felt familiar on the surface and deeply different underneath.

## No Mempool

The biggest shift: Solana has no public mempool. Transactions go directly to the current leader. There's no window to front-run by watching pending txs — you have to know what to execute before someone else does.

This shifts the competitive landscape. On Ethereum, a lot of MEV is reactive (watching mempool → sandwich). On Solana, it's more predictive — knowing which positions are liquidatable, which pools are arb-able, and getting your transaction in the right leader slot.

## Jito and the Block Engine

Jito Labs built a private mempool layer for Solana validators. Searchers submit bundles — ordered transaction sets — through Jito's block engine, and winning bundles get executed atomically in leader slots. It's Solana's equivalent of Flashbots.

If you're building any kind of MEV-sensitive bot on Solana, you need to understand Jito bundles.

## Parallel Execution

Solana's SVM executes non-conflicting transactions in parallel within a slot. This means transaction ordering within a slot is less deterministic than Ethereum's sequential model. Your bundle landing doesn't mean it lands in the exact position you expect relative to other parallel txs.

## Takeaway

The surface area for MEV on Solana is real, but the tooling is less mature and the dynamics are different enough that Ethereum intuitions can mislead you. Build small, instrument everything, and read the Jito docs carefully.
