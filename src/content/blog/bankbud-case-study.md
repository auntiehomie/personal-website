---
title: "BankBud: From Rate Tracker to DeFi Onboarding Funnel"
meta_title: "BankBud Case Study — From Rate Comparison to DeFi Discovery"
description: "How BankBud evolved from a simple rate comparison tool into a progressive DeFi onboarding funnel — and what it taught us about non-crypto users."
date: 2026-06-19T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["Case Study", "DeFi", "Finance"]
author: "Amanda"
tags: ["bankbud", "defi", "product-design", "case-study"]
draft: false
---

## Problem

The average US savings account pays **0.01–0.10% APY**. High-yield savings accounts (HYSAs) offer 3.8–4.5%. And DeFi stablecoin yields sit at 4–9%. That's not a small gap — on a $50,000 balance, the difference between 0.01% and 4% is **$2,000 a year**.

Three things were blocking the average person from capturing that difference:

**1. Opacity.** Finding the best rate means cross-referencing Bankrate, NerdWallet, and your own bank's website. Nobody does that more than once a year.

**2. Friction.** Moving banks takes paperwork, direct deposit updates, and weeks of nerve-wracking transfer delays. The switching cost is real.

**3. The crypto wall.** Even if somebody hears about 9% yields on USDC, the path to get there requires understanding wallets, seed phrases, gas fees, and DEXs. Most people stop at "I don't want to lose my money in crypto."

The challenge: **build a product that closes the rate gap without asking users to learn crypto first.**

---

## Action

### Phase 1: The Rate Engine

First, we built the data layer. The Perplexity rate scraper evolved into a Jina-first, Perplexity-fallback pipeline that covers **18+ banks** across savings, CDs, and money market accounts. Each rate is tagged by account type and bank name, cached with a 1-hour TTL, and validated against FRED benchmark data to catch outliers.

### Phase 2: Conversational Rate Checking

The chat interface lets users ask "Is my bank still competitive?" or "What's the best CD rate right now?" without navigating bank-by-bank data. The AI response includes citations, direct comparisons, and plain-language explanations of what each rate actually means for their balance.

### Phase 3: The Yield Continuum

This was the breakthrough. Instead of jumping straight to "here's a DeFi protocol," we built a **side-by-side comparison pane** showing:

| Tier | Products | Risk Label |
|------|----------|------------|
| Base | Savings accounts, CDs | **Cash** |
| Mid | HYSAs, money market | **Cash+** |
| High | Stablecoin yields (Aave, sDAI) | **Enhanced** |
| Growth | Aggressive DeFi strategies | **Growth** |

Risk labels are plain language with tooltips explaining smart contract risk, audit status, and insurance coverage. No wallet required. No crypto knowledge needed. Just a visual showing "your bank pays X% — here's what else exists."

### Phase 4: Progressive Onboarding

The funnel works in deliberate steps:

1. **Compare** — user sees their bank rate vs. the market
2. **"Earn 4–9% on your dollars"** — DeFi yield shown alongside, crypto remains invisible
3. **Micro-commit** — optional $10 trial deposit
4. **Full migration** — gradual yield optimization, still no blockchain visible

---

## Result

- **Rate coverage:** 18+ banks monitored daily across savings, CDs, and money market products
- **DeFi transparency:** Users can see Aave, Spark, and Morpho yields without a wallet, a seed phrase, or knowing what "DeFi" means
- **Progressive funnel:** Each step feels natural — compare rates → see better alternatives → try a small amount → optimize fully
- **Risk communication:** The tiered risk labeling (Cash / Cash+ / Enhanced / Growth) eliminated the "I don't want to lose my money" objection by making risk feel familiar and bounded

The key insight: **non-crypto users don't need to understand DeFi. They need to understand that "better than 0.01% APY" exists, and that the path there doesn't require memorizing 12-word seed phrases.**

BankBud isn't just a rate tracker. It's a bridge — from the old banking system to whatever comes next.

*BankBud is open source on [GitHub](https://github.com/auntiehomie/bankbud).*