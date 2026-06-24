#!/usr/bin/env node
// migrate.js — Pull all data from Apps Script API and save as individual JSON files in data/
// Usage: node migrate.js <APPS_SCRIPT_URL>

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = process.argv[2];
if (!API_URL) {
  console.error('Usage: node migrate.js <APPS_SCRIPT_URL>');
  console.error('Example: node migrate.js "https://script.google.com/macros/s/AKfycb.../exec"');
  process.exit(1);
}

// Map from API response keys to filenames
const COLLECTION_MAP = {
  tasks:          'tasks.json',
  projects:       'projects.json',
  team:           'team.json',
  meetings:       'meetings.json',
  missions:       'missions.json',
  leaves:         'leaves.json',
  shoots:         'shoots.json',
  videos:         'videos.json',
  events:         'events.json',
  feeds:          'feeds.json',
  campaigns:      'campaigns.json',
  designs:        'designs.json',
  publishing:     'publishing.json',
  seoProjects:    'seo.json',
  websiteProjects:'website.json',
  contentItems:   'content.json',
  socialRecords:  'social.json',
  rules:          'rules.json',
  cdoBalances:    'cdo-balances.json',
  cdoRedemptions: 'cdo-redemptions.json',
  notifs:         'notifications.json',
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'AerOS-Migrate/1.0' } }, res => {
      // Follow redirects (Apps Script does 302)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  console.log('Fetching all data from Apps Script...');
  const url = new URL(API_URL);
  url.searchParams.set('action', 'getAll');

  const raw = await fetch(url.toString());
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse API response:', raw.slice(0, 500));
    process.exit(1);
  }

  let saved = 0;
  for (const [key, filename] of Object.entries(COLLECTION_MAP)) {
    const items = data[key] || [];
    const outPath = path.join(dataDir, filename);
    fs.writeFileSync(outPath, JSON.stringify(items, null, 2) + '\n');
    console.log(`  ${filename}: ${Array.isArray(items) ? items.length + ' items' : 'written'}`);
    saved++;
  }

  console.log(`\nDone! ${saved} files written to data/`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
