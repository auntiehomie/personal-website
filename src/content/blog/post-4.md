---
title: "What I Track in BankBud (And Why)"
meta_title: "What I Track in BankBud (And Why)"
description: "BankBud started as a rate tracker. Here's what it's become and what problems it actually solves."
date: 2025-02-10T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["Finance", "Tools"]
author: "Amanda"
tags: ["bankbud", "finance", "tools"]
draft: false
---

BankBud started because I was tired of manually checking HYSA rates every few weeks to see if my bank had quietly dropped below better alternatives.

That's still in there. But the project grew.

## What It Tracks

- **Savings rates** — live APY data from major HYSAs and CDs, refreshed daily
- **Rate news** — Fed announcements, rate change signals, bank-specific updates
- **Chat interface** — ask it questions like "is my bank still competitive?" and get a direct answer with citations

## Why Chat

The insight was that the raw data isn't the hard part. The analysis is. "Should I move my savings account?" is a question that requires knowing current rates, where you are now, and whether the spread justifies the friction of switching.

The chat layer wraps the data in enough context to give you a real answer, not just a table to interpret yourself.

## What's Next

I want to add CD ladder modeling — given a target duration and amount, what's the optimal ladder structure across currently available CDs. It's a solved problem mathematically but most tools don't surface it well.

[BankBud on GitHub](https://github.com/auntiehomie/bankbud)
