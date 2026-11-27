import { test, expect } from '@playwright/test';

test('teacher tour is skippable, persists, and can be replayed from Help', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tiny-web-demo-mode', '1');
    if (!sessionStorage.getItem('tour-test-init')) {
      localStorage.removeItem('tiny-tour-teacher-v1');
      localStorage.removeItem('tiny-tour-guardian-v1');
      sessionStorage.setItem('tour-test-init', '1');
    }
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: /teacher tour/i })).toBeVisible();
  await dialog.getByRole('button', { name: /^next$/i }).click();
  await expect(dialog).toContainText(/step 2 of 10/i);
  await dialog.getByRole('button', { name: /skip tour/i }).click();
  await expect(dialog).toBeHidden();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.goto('/help', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /teacher tour/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: /close tour/i }).click();
});

test('guardian guide explains only the SMS experience', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tiny-web-demo-mode', '1');
    localStorage.setItem('tiny-tour-teacher-v1', '1');
    if (!sessionStorage.getItem('guardian-tour-test-init')) {
      localStorage.removeItem('tiny-tour-guardian-v1');
      sessionStorage.setItem('guardian-tour-test-init', '1');
    }
  });
  await page.goto('/guardian/conversation_amina', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: /guardian guide/i })).toBeVisible();
  await expect(dialog).toContainText(/ordinary sms/i);
  await dialog.getByRole('button', { name: /^next$/i }).click();
  await expect(dialog).toContainText(/step 2 of 4/i);
  await dialog.getByRole('button', { name: /^next$/i }).click();
  await dialog.getByRole('button', { name: /^next$/i }).click();
  await expect(dialog).toContainText(/step 4 of 4/i);
  await dialog.getByRole('button', { name: /finish/i }).click();
  await expect(dialog).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('dialog')).toBeHidden();
});
