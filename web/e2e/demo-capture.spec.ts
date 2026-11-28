import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * Deterministic 1440x900 captures used by the reviewed demo video. These are
 * viewport shots (not full page) so text stays legible in the 1080p video.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tiny-web-demo-mode', '1');
    localStorage.setItem('tiny-tour-teacher-v1', '1');
    localStorage.setItem('tiny-tour-guardian-v1', '1');
  });
});

test('captures legible demo screens', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'), 'Demo capture runs once at desktop width.');
  mkdirSync('../artifacts/demo/screens', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  const shots = [
    ['/', /good morning/i, 'web-home'],
    ['/pupils/pupil_amina', /Amina Bello/, 'web-pupil-profile'],
    ['/classes/class_p4_blue/intelligence', /P4 Blue/, 'web-class-intelligence'],
    ['/followups', /open follow-ups/i, 'web-followups'],
    ['/intelligence', /^Intelligence$/, 'web-intelligence'],
  ] as const;
  for (const [route, heading, name] of shots) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    await page.screenshot({ path: `../artifacts/demo/screens/${name}.png`, fullPage: false });
  }
});
