import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Firebase Auth creates a hidden iframe. On slow networks that iframe can delay
// the browser `load` event even though the rendered app is already usable.
async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function openClasses(page: Page) {
  // The mobile bottom navigation is covered by a fixed shell in headless
  // Chromium emulation, so functional tests open the route directly. The
  // visual test separately asserts the visible mobile navigation and href.
  await open(page, '/classes');
}

async function waitForPersistedText(page: Page, text: string) {
  await expect.poll(
    async () => page.evaluate((value) => {
      const raw = localStorage.getItem('tiny-web-state-v1');
      return raw ? raw.includes(value) : false;
    }, text),
    { timeout: 5_000 },
  ).toBe(true);
}

async function waitForOfflineReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
        setTimeout(resolve, 5000);
      });
    }
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tiny-web-demo-mode', '1');
  });
});

test('teacher can create a class, submit attendance and record progress', async ({ page }) => {
  await open(page, '/');
  await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible();

  await openClasses(page);
  await page.getByRole('button', { name: /new class/i }).click();
  await page.getByPlaceholder('Blue').fill('Amber');
  await page.getByRole('button', { name: /save class locally/i }).click();
  await expect(page.getByRole('heading', { name: 'P4 Amber', exact: true })).toBeVisible();
  await waitForPersistedText(page, 'Amber');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'P4 Amber', exact: true })).toBeVisible();

  await open(page, '/attendance/class_p4_blue');
  for (const pupil of ['Amina Bello', 'Musa Ibrahim', 'Ngozi Okafor', 'Tunde Adeyemi']) {
    await page.getByRole('group', { name: `Attendance for ${pupil}` }).getByRole('button', { name: 'Present' }).click();
  }
  await page.getByRole('button', { name: /submit register/i }).click();
  await expect(page.locator('.inline-success').filter({ hasText: /attendance submitted locally/i })).toBeVisible();

  await open(page, '/progress/pupil_amina');
  await page.getByLabel(/factual observation/i).fill('Synthetic web test observation: names three water sources.');
  await page.getByRole('button', { name: /approve locally/i }).click();
  await expect(page.locator('.inline-info').filter({ hasText: /progress approved locally/i })).toBeVisible();
});

test('teacher and guardian simulator can exchange messages', async ({ page }) => {
  await open(page, '/messages/conversation_amina');
  await page.getByPlaceholder(/write a short, factual reply/i).fill('Synthetic teacher web reply.');
  await page.getByRole('button', { name: /queue reply/i }).click();
  await expect(page.getByText('Synthetic teacher web reply.')).toBeVisible();
  await waitForPersistedText(page, 'Synthetic teacher web reply.');

  await open(page, '/guardian/conversation_amina');
  await page.getByLabel('Guardian message').fill('Synthetic guardian web reply.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Synthetic guardian web reply.')).toBeVisible();
  await waitForPersistedText(page, 'Synthetic guardian web reply.');

  await open(page, '/messages/conversation_amina');
  await expect(page.getByText('Synthetic guardian web reply.')).toBeVisible();
});

test('offline banner and local draft survive a reload', async ({ page, context }) => {
  await open(page, '/attendance/class_p4_blue');
  await page.getByRole('group', { name: 'Attendance for Amina Bello' }).getByRole('button', { name: 'Late' }).click();
  await page.getByRole('button', { name: /save draft/i }).click();
  await expect(page.locator('.inline-success').filter({ hasText: /draft saved on this device/i })).toBeVisible();

  await waitForOfflineReady(page);
  await context.setOffline(true);
  await expect(page.getByText(/you are offline/i)).toBeVisible();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/you are offline/i)).toBeVisible();
  await expect(page.getByRole('group', { name: 'Attendance for Amina Bello' }).getByRole('button', { name: 'Late' })).toHaveClass(/selected/);
  await context.setOffline(false);
});

test('home has no serious or critical accessibility violations', async ({ page }) => {
  await open(page, '/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(serious.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
});
