#!/usr/bin/env node

/**
 * sync-knowledgebase.js
 *
 * Syncs rufus-vault knowledgebase notes to personal-website MDX content.
 * Preserves existing files — only adds new entries and updates by URL match.
 *
 * Usage:
 *   node scripts/sync-knowledgebase.js          # one-shot sync
 *   node scripts/sync-knowledgebase.js --watch   # watch mode (requires chokidar)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, extname } from 'path';

const VAULT_NOTES_FILE = resolve('/root/.openclaw/workspace/rufus-vault/notes/Knowledge Base 1.md');
const KB_OUTPUT_DIR = resolve('src/content/knowledgebase');

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function extractSourceName(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return host.split('.')[0];
  } catch {
    return 'unknown';
  }
}

/** Strip UTM tracking params from a URL for dedup matching */
function stripTracking(url) {
  return url.replace(/[?&]utm_[^&]+/g, '').replace(/\?$/, '');
}

function guessCategory(tags) {
  const categoryMap = {
    ai: 'ai',
    agi: 'ai',
    tech: 'tech',
    dev: 'dev',
    crypto: 'crypto',
    defi: 'crypto',
    finance: 'finance',
    farcaster: 'farcaster',
    security: 'security',
    privacy: 'security',
    business: 'business',
  };
  for (const tag of tags) {
    const mapped = categoryMap[tag.toLowerCase()];
    if (mapped) return mapped;
  }
  return 'other';
}

function generateMDX(entry) {
  const slug = slugify(entry.title);
  const dateStr = entry.date || new Date().toISOString().split('T')[0];
  const category = guessCategory(entry.tags);
  const description = entry.summary || `Link to ${entry.source}`;

  return {
    slug,
    content: `---
title: "${entry.title.replace(/"/g, '\\"')}"
url: "${entry.url.replace(/"/g, '\\"')}"
source: "${entry.source.replace(/"/g, '\\"')}"
tags: ${JSON.stringify(entry.tags)}
date: ${dateStr}
category: "${category}"
description: "${description.replace(/"/g, '\\"')}"
draft: false
---

${entry.summary || `External link: [${entry.title}](${entry.url})`}
`,
  };
}

// ── Read existing MDX files and index by URL ──────────────────────────────

function indexExistingMDX(dir) {
  const byUrl = new Map();
  if (!existsSync(dir)) return byUrl;

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.mdx')) continue;
    const content = readFileSync(resolve(dir, file), 'utf-8');
    const urlMatch = content.match(/^url:\s*"([^"]+)"/m);
    if (urlMatch) {
      // Strip tracking params for matching so utm/tracking URLs don't create duplicates
    const cleanUrl = stripTracking(urlMatch[1]);
    byUrl.set(cleanUrl, { filename: file, content });
    }
  }
  return byUrl;
}

// ── Parse vault notes ─────────────────────────────────────────────────────

function parseVaultNotes(content) {
  const entries = [];
  const lines = content.split('\n');

  let currentTitle = '';
  let currentUrl = '';
  let currentSource = '';
  let currentTags = [];
  let currentSummary = '';
  let currentDate = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Match [Title](URL) format — primary format
    let match = line.match(/^\[?\[?\[?([^\]]+)\]?\]?\]?\(([^)]+)\)/);
    if (match) {
      // Save previous entry if exists
      if (currentTitle && currentUrl) {
        entries.push({
          title: currentTitle,
          url: currentUrl,
          source: currentSource,
          tags: currentTags,
          date: currentDate,
          summary: currentSummary,
        });
      }

      currentTitle = match[1].replace(/[*_]/g, '').trim();
      currentUrl = match[2];
      currentSource = extractSourceName(currentUrl);
      currentTags = [];
      currentSummary = '';
      currentDate = '';

      // Check if line continues with summary after the URL
      const rest = line.slice(match[0].length).trim();
      if (rest.startsWith('-')) {
        currentSummary = rest.replace(/^-\s*/, '');
      }
      continue;
    }

    // Match bare URL lines
    match = line.match(/^https?:\/\/[^\s]+/);
    if (match) {
      if (currentTitle && currentUrl) {
        entries.push({
          title: currentTitle,
          url: currentUrl,
          source: currentSource,
          tags: currentTags,
          date: currentDate,
          summary: currentSummary,
        });
      }

      currentUrl = match[0];
      currentTitle = currentUrl;
      currentSource = extractSourceName(currentUrl);
      currentTags = [];
      currentSummary = '';
      currentDate = '';
      continue;
    }

    // Metadata lines (structured format)
    if (line.startsWith('- **Source:**')) {
      currentSource = line.replace('- **Source:**', '').trim();
    } else if (line.startsWith('- **Added:**')) {
      currentDate = line.replace('- **Added:**', '').trim();
    } else if (line.startsWith('- **Tags:**')) {
      currentTags = line.replace('- **Tags:**', '').trim().split(/,\s*/);
    } else if (line.startsWith('- **Summary:**')) {
      currentSummary = line.replace('- **Summary:**', '').trim();
    }
  }

  // Push last entry
  if (currentTitle && currentUrl) {
    entries.push({
      title: currentTitle,
      url: currentUrl,
      source: currentSource,
      tags: currentTags,
      date: currentDate,
      summary: currentSummary,
    });
  }

  return entries;
}

// ── Sync (preserving existing slugs) ──────────────────────────────────────

function sync() {
  console.log(`📖 Reading vault notes from ${VAULT_NOTES_FILE}...`);
  const content = readFileSync(VAULT_NOTES_FILE, 'utf-8');
  const entries = parseVaultNotes(content);
  console.log(`   Found ${entries.length} entries.`);

  // Ensure output directory exists
  if (!existsSync(KB_OUTPUT_DIR)) {
    mkdirSync(KB_OUTPUT_DIR, { recursive: true });
    console.log(`   Created ${KB_OUTPUT_DIR}`);
  }

  // Index existing files by URL to preserve slugs
  const existingByUrl = indexExistingMDX(KB_OUTPUT_DIR);

  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    // Check if we already have this URL
    // Normalize entry URL for lookup (strip tracking params)
    const entryUrlClean = stripTracking(entry.url);
    const existing = existingByUrl.get(entryUrlClean);

    const { slug, content: mdx } = generateMDX(entry);

    if (existing) {
      // Preserve existing filename
      const filePath = resolve(KB_OUTPUT_DIR, existing.filename);
      if (existing.content !== mdx) {
        writeFileSync(filePath, mdx);
        updated++;
        console.log(`   📝 Updated: ${existing.filename}`);
      }
    } else {
      // New entry
      const filename = `${slug}.mdx`;
      const filePath = resolve(KB_OUTPUT_DIR, filename);
      writeFileSync(filePath, mdx);
      created++;
      console.log(`   ✨ Created: ${filename}`);
    }
  }

  console.log(`✅ Sync complete: ${created} created, ${updated} updated.`);
}

// ── Main ──────────────────────────────────────────────────────────────────

const isWatchMode = process.argv.includes('--watch');

sync();

if (isWatchMode) {
  const chokidar = require('chokidar');
  console.log('👀 Watching for changes...');
  chokidar.watch(VAULT_NOTES_FILE).on('change', () => {
    console.log(`\n🔄 ${new Date().toLocaleTimeString()} — file changed, re-syncing...`);
    sync();
  });
}