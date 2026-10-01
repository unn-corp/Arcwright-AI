#!/usr/bin/env node
/**
 * Verify that page headers lead with their main heading.
 *
 * The front-end copy contract forbids route or descriptor rows above a page
 * heading. This lightweight structural check catches the pattern without
 * adding a parser dependency.
 *
 *   npm run check:copy
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pagesRoot = path.resolve(here, '..', 'src', 'pages');
const pageFiles = fs.readdirSync(pagesRoot).filter((file) => file.endsWith('.tsx'));

const errors = [];
const pageHeaderMarker = '{/* Page header */}';
const contentBeforeHeading = /<(?:p|span)\b|<div\b[^>]*>[\s\S]*?<\/div>/;

for (const file of pageFiles) {
  const source = fs.readFileSync(path.join(pagesRoot, file), 'utf8');

  const headerStart = source.indexOf(pageHeaderMarker);
  if (headerStart < 0) continue;

  const headingStart = source.indexOf('<h1', headerStart);
  const line = source.slice(0, headerStart).split('\n').length;
  if (headingStart < 0) {
    errors.push(`${file}:${line} page header has no <h1>`);
    continue;
  }

  const prefix = source.slice(headerStart + pageHeaderMarker.length, headingStart);
  if (contentBeforeHeading.test(prefix)) {
    errors.push(`${file}:${line} renders descriptor content before its <h1>`);
  }
}

if (errors.length) {
  console.error('\n✗ website copy contract check failed:\n');
  for (const error of errors) console.error(`   ${error}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ website copy contract: ${pageFiles.length} page headers lead with their main heading`);
