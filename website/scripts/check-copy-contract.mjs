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
const elementBeforeHeading = /<div\b[^>]*className=(?:"[^"]*"|'[^']*')[^>]*>[\s\S]*?<\/div>\s*<h1\b/g;

for (const file of pageFiles) {
  const source = fs.readFileSync(path.join(pagesRoot, file), 'utf8');

  for (const match of source.matchAll(elementBeforeHeading)) {
    if (!/\bitems-baseline\b/.test(match[0])) continue;

    const line = source.slice(0, match.index ?? 0).split('\n').length;
    errors.push(`${file}:${line} contains an items-baseline row immediately before <h1>`);
  }
}

if (errors.length) {
  console.error('\n✗ website copy contract check failed:\n');
  for (const error of errors) console.error(`   ${error}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ website copy contract: ${pageFiles.length} page headers lead with their main heading`);
