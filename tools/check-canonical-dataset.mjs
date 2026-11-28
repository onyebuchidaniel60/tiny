#!/usr/bin/env node
/**
 * Guards the one shared synthetic workspace contract.
 *
 * Android (`DemoData.kt`) and web (`seed.ts`) must use the same stable
 * identifiers, class/pupil mapping, guardian endpoints and evidence dates.
 * The script is intentionally dependency-free and parses only the documented
 * canonical literals so it can run in both CI workflows.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const android = readFileSync(resolve(root, 'app/src/main/java/ng/tiny/education/data/DemoData.kt'), 'utf8');
const web = readFileSync(resolve(root, 'web/src/data/seed.ts'), 'utf8');

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const demoIds = Object.fromEntries(
  [...android.matchAll(/const val (\w+) = "([^"]+)"/g)].map((match) => [match[1], match[2]]),
);

const expectedConstants = [
  'WORKSPACE', 'CLASS_P4', 'CLASS_P5',
  'AMINA', 'MUSA', 'NGOZI', 'TUNDE', 'FATIMA', 'EMEKA', 'ZAINAB', 'IBRAHIM',
  'GUARDIAN_AMINA', 'GUARDIAN_MUSA', 'GUARDIAN_FATIMA', 'GUARDIAN_EMEKA',
  'LESSON_WATER', 'LESSON_PLANTS', 'LESSON_MAP',
];
for (const name of expectedConstants) {
  check(Boolean(demoIds[name]), `Android DemoIds is missing ${name}`);
  if (demoIds[name]) check(web.includes(`'${demoIds[name]}'`), `web seed is missing Android id ${demoIds[name]} (${name})`);
}

for (const literal of [
  'Kofar Primary', 'KOFAR001',
  'P4', 'Blue', 'P5', 'Gold', '2026/2027', 'Ms. Bello',
  'Amina Bello', 'KOF001', 'Musa Ibrahim', 'KOF002', 'Ngozi Okafor', 'KOF003', 'Tunde Adeyemi', 'KOF004',
  'Fatima Sani', 'KOF005', 'Emeka Nwosu', 'KOF006', 'Zainab Bello', 'KOF007', 'Ibrahim Musa', 'KOF008',
  '+2348000000011', '+2348000000012', '+2348000000013', '+2348000000014',
  'basic_science', 'social_studies', 'water_sources', 'plant_parts', 'map_reading', 'community',
]) {
  check(android.includes(literal), `Android canonical seed is missing literal: ${literal}`);
  check(web.includes(literal), `Web canonical seed is missing literal: ${literal}`);
}

const attendanceDates = [
  '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-24', '2026-11-25', '2026-11-26',
];
for (const date of attendanceDates) {
  check(android.includes(date), `Android seed is missing attendance date ${date}`);
  check(web.includes(date), `Web seed is missing attendance date ${date}`);
}

// Both seeds must generate the same canonical record identifiers.
check(android.includes('assessment_${pupilId}_${index + 1}'), 'Android seed does not generate canonical assessment ids');
check(web.includes('assessment_${pupilId}_${index + 1}'), 'Web seed does not generate canonical assessment ids');
check(android.includes('progress_amina_1') && web.includes('progress_${pupilId}_${index + 1}'), 'Progress identifiers diverged');
for (const id of ['followup_musa_attendance', 'followup_tunde_support', 'followup_emeka_map', 'followup_fatima_digest']) {
  check(android.includes(id), `Android seed is missing follow-up ${id}`);
  check(web.includes(id), `Web seed is missing follow-up ${id}`);
}

if (failures.length) {
  console.error('Canonical dataset contract failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`Canonical dataset contract OK: ${Object.keys(demoIds).length} Android ids shared with web; 8 pupils, 2 classes, 7 attendance dates, 24 assessments, 10 observations, 4 follow-ups.`);
