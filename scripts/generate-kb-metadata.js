#!/usr/bin/env node
/**
 * Generate metadata for new knowledgebase entries
 *
 * Usage:
 *   node scripts/generate-kb-metadata.mjs --url <url> --title <title> --source <source> --tags <tag1,tag2> --category <cat> --date <YYYY-MM-DD>
 *
 * Or interactive mode:
 *   node scripts/generate-kb-metadata.mjs
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith("--")) {
        parsed[key] = val;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

function generateMDX(meta) {
  const now = new Date().toISOString().split("T")[0];
  const tags = meta.tags
    ? meta.tags.split(",").map((t) => t.trim())
    : ["other"];
  const date = meta.date || now;

  return `---
title: "${meta.title}"
url: "${meta.url}"
source: "${meta.source}"
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
date: ${date}
category: "${meta.category || "other"}"
description: "${meta.description || (meta.title + " — saved as a knowledgebase entry.")}"
draft: false
---

${meta.title}
`;
}

// Interactive mode
if (args.length === 0) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const questions = [
    "Title: ",
    "URL: ",
    "Source (domain): ",
    "Tags (comma-separated): ",
    "Category: ",
    "Date (YYYY-MM-DD, default today): ",
    "Description (optional): ",
  ];
  const answers = [];

  function ask(i) {
    if (i >= questions.length) {
      const meta = {
        title: answers[0],
        url: answers[1],
        source: answers[2],
        tags: answers[3],
        category: answers[4],
        date: answers[5] || undefined,
        description: answers[6] || undefined,
      };

      const mdx = generateMDX(meta);
      const filename = slugify(meta.title) + ".mdx";
      const kbDir = path.join(process.cwd(), "src", "content", "knowledgebase");
      const filepath = path.join(kbDir, filename);

      if (!fs.existsSync(kbDir)) {
        fs.mkdirSync(kbDir, { recursive: true });
      }

      fs.writeFileSync(filepath, mdx, "utf-8");
      console.log(`\n✅ Created: ${filepath}`);
      rl.close();
      return;
    }
    rl.question(questions[i], (answer) => {
      answers.push(answer);
      ask(i + 1);
    });
  }

  ask(0);
} else {
  // CLI mode
  const parsed = parseArgs(args);
  if (!parsed.title || !parsed.url || !parsed.source) {
    console.error(
      "Usage: node scripts/generate-kb-metadata.mjs --title <title> --url <url> --source <source> [--tags <a,b,c>] [--category <cat>] [--date <YYYY-MM-DD>] [--description <desc>]",
    );
    process.exit(1);
  }

  const mdx = generateMDX(parsed);
  const filename = slugify(parsed.title) + ".mdx";
  const kbDir = path.join(process.cwd(), "src", "content", "knowledgebase");
  const filepath = path.join(kbDir, filename);

  if (!fs.existsSync(kbDir)) {
    fs.mkdirSync(kbDir, { recursive: true });
  }

  fs.writeFileSync(filepath, mdx, "utf-8");
  console.log(`✅ Created: ${filepath}`);
}