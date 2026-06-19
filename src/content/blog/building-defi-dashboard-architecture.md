---
title: "Building a DeFi Dashboard — Architecture Decisions"
meta_title: "Building a DeFi Dashboard — Architecture Decisions"
description: "The technical architecture behind the liquidation bot: WebSocket vs polling, subgraph vs RPC, and how to make profitability decisions in milliseconds."
date: 2026-06-19T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["DeFi", "Architecture"]
author: "Amanda"
tags: ["architecture", "defi", "typescript", "arbitrum", "bots", "design"]
draft: false
---

I spent the last few months building a liquidation bot for Aave V3 on Arbitrum. The architecture decisions along the way are worth writing down — not because they're perfect, but because they illustrate real tradeoffs you hit when building on-chain tooling.

This post covers the key architecture choices and what I'd do differently next time.

---

## The Core Loop

Every liquidation bot — stripped to essentials — does this:

1. **Find borrowers** whose health factor is below 1.0
2. **Check profitability** (does the liquidation bonus exceed gas costs?)
3. **Execute** the liquidation atomically via `liquidationCall()`
4. **Swap** seized collateral back to a stablecoin
5. **Log everything** for P&L tracking

The hard part isn't step 3. It's steps 1 and 2, under real market conditions.

---

## WebSocket vs Polling

**Decision:** Run both — WebSocket for sub-second trigger, polling loop as fallback.

The WebSocket provider subscribes to `newBlock` events on Arbitrum. Every new block triggers an immediate opportunity scan. Polling still runs at the configured interval (several seconds) as a fallback for when the WebSocket disconnects.

```typescript
// WebSocket path — sub-second trigger
wsProvider.on('block', async (blockNumber) => {
  const opportunities = await monitor.findLiquidationOpportunities();
  await processOpportunities(opportunities, ...);
});

// Polling fallback — every N seconds
while (running) {
  const opportunities = await monitor.findLiquidationOpportunities();
  await processOpportunities(opportunities, ...);
  await sleep(currentPollIntervalMs);
}
```

**Key detail:** Exponential backoff on the polling interval (2× after each empty cycle, up to 5 minute cap). No point scanning aggressively when there's nothing to find.

The WebSocket also has exponential backoff reconnection (5s → 60s cap, max 10 attempts). If it can't reconnect, the polling loop keeps the bot alive.

---

## Subgraph vs Direct RPC

**Decision:** The Graph (subgraph) as primary borrower discovery, RPC `eth_getLogs` as fallback.

The Aave V3 subgraph indexes all user positions and health factors. A single query returns all liquidatable borrowers. It's fast, clean, and structured.

But subgraphs can lag behind the latest block by several seconds. During volatile markets, that latency means missed opportunities.

The fallback path uses `eth_getLogs` to scan recent blocks for `Borrow` events, then queries each borrower's health factor directly via `getUserAccountData()`. It's slower (requires one RPC call per borrower), but it's real-time.

**Practical approach:** Query the subgraph every cycle. If it returns results, use them. If it lags or errors, fall back to RPC. Both paths feed the same opportunity processing pipeline.

---

## Profitability in Real Time

Every liquidation opportunity needs a profit check before execution. The naive approach — estimate gas cost, compare to liquidation bonus — misses important subtleties.

### Slippage Modeling

The bot seizes collateral at a bonus (5% on Aave V3) and immediately swaps it to USDC via 1inch. The swap incurs slippage that can wipe out the profit if the liquidity pool is thin.

I modeled this as: `netProfit = collateralValue * bonus - gasCostUSD - slippageCost`

Slippage cost is derived from swap simulation (not a flat percentage). This catches cases where a position looks profitable on paper but the collateral token has < $10k of liquidity.

### Gas Cost Floor

Even when Ethereum is cheap, every liquidation costs at minimum `21000 * gasPrice * ethPriceUSD`. On Arbitrum, gas is cheaper but the minimum still matters for small positions.

The bot enforces a `minProfitUSD` floor ($10 currently) that filters out opportunities where the profit is less than the gas cost uncertainty.

### The 50% Debt Cap

Aave limits debt coverage to 50% of the borrower's position per liquidation call. This means the profitability check must account for partial debt coverage — you can't seize all the collateral in one transaction.

---

## Flash Loans vs Self-Funded

**Decision:** Both modes supported, switchable via env var.

Self-funded liquidations require the bot wallet to hold ETH for gas plus enough USDC to cover the debt. That capital sits idle between opportunities.

Flash loans (via Balancer V2) eliminate the capital requirement at the cost of one extra contract call. The atomic flow is: `flash borrow → liquidate → 1inch swap → repay flash loan → keep profit`.

The flash loan adds ~$0.50–$2.00 in gas per liquidation but unlocks unlimited capital efficiency. For a bot that's still tuning profitability parameters, having the option to run both modes is invaluable.

---

## What I'd Do Differently

**Rust for the hot path.** TypeScript is fine for monitoring and orchestration, but for the execution path — where 100ms of GC pause means losing a race — I'd write the core liquidation loop in Rust using `alloy-rs` or similar.

**Dedicated RPC.** Free-tier RPC endpoints have aggressive rate limits that cause missed opportunities during high-volatility events (exactly when you need them most). A dedicated Arbitrum Nitro archive node would eliminate this bottleneck entirely.

**Jito/Flashbots bundles.** On Arbitrum, MEV protection isn't as mature as Ethereum's Flashbots, but private transaction submission through Flashbots or a trusted sequencer would prevent frontrunning on liquidation transactions.

**Better failure analytics.** The bot logs every skip reason, but I want a dashboard that shows "missed N opportunities in the last hour because subgraph was N blocks behind" — not just aggregate numbers.

---

## Summary

| Decision | Choice | Why |
|----------|--------|-----|
| Trigger | WS + polling | Speed + reliability |
| Borrower discovery | Subgraph + RPC | Speed (subgraph) with recency (RPC) |
| Profitability | Simulated swap | Catches thin liquidity |
| Capital | Flash loan optional | Flexibility |
| Language | TypeScript | Ship velocity; would use Rust for re-write |

Building on-chain tooling means making tradeoffs between speed, reliability, and capital efficiency. The right choice depends on your risk profile. For a bootstrapped project, I optimized for **reliability over speed** — miss a few liquidations rather than lose money on a bad one.

*The full source is on [GitHub](https://github.com/auntiehomie/liquidation-bot).*