import { test, expect } from '@playwright/test';

// Manual live check. Run with:
//   TINY_LIVE_FIREBASE=1 npx playwright test e2e/firebase-live.spec.ts --project=desktop-chromium
// It uses the synthetic Firebase Auth account and consumes a small free-tier AI request.
test.skip(!process.env.TINY_LIVE_FIREBASE, 'Set TINY_LIVE_FIREBASE=1 to run the live Firebase check.');
test.setTimeout(90_000);

test('Firebase sign-in, Firestore bootstrap and AI source are live', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /open your workspace/i })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Tiny Web Demo Primary').first()).toBeVisible({ timeout: 20_000 });

  await page.goto('/ai', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /generate a strategy/i }).first().click();
  await expect(page.locator('.ai-result')).toContainText(/Cloud Gemini|On-device Gemini Nano/, { timeout: 45_000 });
  await expect(page.locator('.ai-result')).not.toContainText('Unknown inference source');
});
