---
title: "Why I Switched My Personal Site to Astro"
meta_title: "Why I Switched My Personal Site to Astro"
description: "After years of over-engineered personal sites, Astro finally felt like the right tool — here's why."
date: 2025-03-01T00:00:00Z
image: "/images/image-placeholder.png"
categories: ["Web", "Tools"]
author: "auntiehomie"
tags: ["astro", "web", "performance"]
draft: false
---

I've rebuilt my personal site more times than I'd like to admit. Next.js, plain HTML, a short-lived Gatsby phase. Each time the framework became the project.

Astro is the first one that didn't.

## What's Different

Astro ships zero JavaScript by default. It renders everything to static HTML at build time, and you only hydrate the components that actually need interactivity. For a personal site — mostly text, maybe a dark mode toggle — that's exactly right.

The content collections API is clean. You define a Zod schema, drop Markdown files in a folder, and get typed, validated data back. No CMS, no database, no YAML foot-guns.

## What I'd Warn About

The component model (`slots`, `Astro.props`, partials vs layouts) has a learning curve if you're coming from React. The mental shift from "component tree" to "template with islands" takes a day or two.

Also, the ecosystem is smaller than Next's. If you need a specific integration, you may be writing it yourself.

## Verdict

For a personal site where the content is the point, Astro is excellent. Fast builds, fast output, and it gets out of the way.

[This site is open source.](https://github.com/auntiehomie/personal-website)
