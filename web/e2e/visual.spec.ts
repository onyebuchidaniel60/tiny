import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tiny-web-demo-mode', '1'));
});

test('captures representative responsive screens', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible();
  await page.screenshot({ path: `../artifacts/web/${testInfo.project.name}-home.png`, fullPage: true });

  await page.goto('/classes/class_p4_blue', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'P4 Blue', exact: true })).toBeVisible();
  await page.screenshot({ path: `../artifacts/web/${testInfo.project.name}-class.png`, fullPage: true });

  if (testInfo.project.name.startsWith('mobile')) {
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await expect(page.locator('.topbar-icon')).toBeVisible();
  } else {
    await expect(page.locator('.sidebar')).toBeVisible();
  }
});
