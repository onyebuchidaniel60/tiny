#!/usr/bin/env node
/**
 * Heuristic hardcoded-UI-string guard.
 *
 * It is deliberately conservative: it flags only visible text nodes and
 * user-facing attributes that contain English prose. Brand names, model ids,
 * grade codes and synthetic field placeholders are allow-listed. The real
 * completeness guarantee comes from tools/generate-i18n.mjs and the platform
 * test suites; this check catches regressions where a label bypasses them.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const findings = [];

const webAllow = new Set([
  'Tiny',
  '5E',
  'P4',
  'P5',
  'KOF009',
  'KOFAR001',
  'gemini-3.5-flash-lite',
  '+2348000000015',
  'Ctrl/⌘ + Enter',
]);

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    if (statSync(path).isDirectory()) entries.push(...walk(path));
    else entries.push(path);
  }
  return entries;
}

function checkWeb() {
  const files = walk(join(root, 'web', 'src')).filter((file) => file.endsWith('.tsx'));
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      // Skip comments, generated dictionaries and test fixtures.
      if (line.trim().startsWith('//') || line.includes('console.warn')) return;
      for (const match of line.matchAll(/(?:aria-label|placeholder|title|alt)="([^"]*[A-Za-z][^"]*)"/g)) {
        const value = match[1].trim();
        if (!webAllow.has(value) && !/^[\d\s+*#·—–-]+$/.test(value)) {
          findings.push(`${relative(root, file)}:${index + 1} attribute literal: ${value}`);
        }
      }
      for (const match of line.matchAll(/>\s*([A-Za-z][^<>{}]*[a-z][^<>{}]*?)\s*</g)) {
        const value = match[1].trim();
        if (webAllow.has(value)) continue;
        if (/^(https?:|mailto:|\/)/.test(value)) continue;
        if (!/[A-Za-z]{3,}\s+[A-Za-z]{2,}/.test(value)) continue;
        findings.push(`${relative(root, file)}:${index + 1} text node: ${value}`);
      }
    });
  }
}

function checkAndroid() {
  const files = walk(join(root, 'app', 'src', 'main', 'java')).filter((file) => file.endsWith('.kt'));
  const patterns = [
    /Text\(\s*"([^"$]{3,})"/g,
    /contentDescription\s*=\s*"([^"]+)"/g,
    /InfoBanner\(\s*"([^"]+)"/g,
    /StatusPill\(\s*"([^"$]{3,})"/g,
    /showMessage\(\s*"([^"]+)"/g,
  ];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.trim().startsWith('//')) return;
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          findings.push(`${relative(root, file)}:${index + 1} hardcoded Compose literal: ${match[1]}`);
        }
      }
    });
  }
}

checkWeb();
checkAndroid();

if (findings.length > 0) {
  console.error('Hardcoded user-facing strings found:');
  for (const finding of [...new Set(findings)]) console.error(`  - ${finding}`);
  console.error('Move these into shared/i18n and reference the translation key.');
  process.exit(1);
}
console.log('No hardcoded user-facing strings found by the guard.');
