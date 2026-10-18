import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Read-only structural check. Token estimates never change the line verdict.
const limitsPath = fileURLToPath(new URL('../data/workflow-limits.json', import.meta.url));
const limits = JSON.parse(readFileSync(limitsPath, 'utf8'));
const files = [];
const issues = [];
const target = process.argv[2];

function inspect(file) {
  const text = readFileSync(file, 'utf8');
  const lines = text === '' ? 0 : text.split(/\r\n|\n|\r/).length - (/\r\n$|[\n\r]$/.test(text) ? 1 : 0);
  const status = lines > limits.stepLines.maximum ? 'FAIL' : lines >= limits.stepLines.recommendedBelow ? 'WARN' : 'GOOD';
  const estimatedTokens = Math.ceil(Array.from(text).length / 4);
  files.push({ path: file, lines, status, estimatedTokens, tokenMethod: 'characters/4 estimate; not model-specific', tokenAdvice: estimatedTokens > limits.promptTokensAdvisory.reviewAbove ? 'REVIEW' : 'NONE' });
}

function walk(entry, inSteps = false, explicit = false) {
  try {
    const stat = lstatSync(entry);
    if (stat.isSymbolicLink()) {
      if (inSteps || explicit || path.basename(entry).startsWith('steps')) issues.push({ path: entry, reason: 'Symlink not followed; scope unchecked' });
    } else if (stat.isFile()) {
      if ((inSteps || explicit) && entry.endsWith('.md')) inspect(entry);
      else if (explicit) issues.push({ path: entry, reason: 'Expected a Markdown step or workflow directory' });
    } else if (stat.isDirectory()) {
      const stepScope = inSteps || path.basename(entry).startsWith('steps');
      for (const item of readdirSync(entry, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (['.git', 'node_modules', '.analysis'].includes(item.name)) continue;
        walk(path.join(entry, item.name), stepScope);
      }
    } else {
      issues.push({ path: entry, reason: 'Unsupported file type; scope unchecked' });
    }
  } catch (error) {
    issues.push({ path: entry, reason: error.message });
  }
}

if (target && process.argv.length === 3) walk(path.resolve(target), false, true);
else issues.push({ reason: 'Usage: node check-step-size.mjs <workflow-directory-or-step.md>' });
if (files.length === 0 && issues.length === 0) issues.push({ reason: 'No Markdown files in steps* directories; scope unchecked' });

const status = issues.length ? 'INCOMPLETE' : files.some(f => f.status === 'FAIL') ? 'FAIL' : files.some(f => f.status === 'WARN') ? 'WARN' : 'PASS';
process.stdout.write(JSON.stringify({ status, limitsPath, limits, files, issues }, null, 2) + '\n');
process.exitCode = status === 'INCOMPLETE' ? 2 : status === 'FAIL' ? 1 : 0;
