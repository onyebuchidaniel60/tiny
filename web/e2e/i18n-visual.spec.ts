import { test, expect, type Page } from '@playwright/test';

const languages = [
  { code: 'en', name: 'English', home: /good morning/i, help: /help centre/i, settings: /your preferences/i, attendance: /^attendance$/i },
  { code: 'ha', name: 'Hausa', home: /ina kwana/i, help: /cibiyar taimako/i, settings: /zaɓuɓɓukanka/i, attendance: /^halarta$/i },
  { code: 'yo', name: 'Yoruba', home: /ẹ káàárọ̀/i, help: /ilé ìrànlọ́wọ́/i, settings: /àwọn àṣàyàn rẹ/i, attendance: /^ìwá sí kíláàsì$/i },
  { code: 'ig', name: 'Igbo', home: /ụtụtụ ọma/i, help: /ebe enyemaka/i, settings: /mmasị gị/i, attendance: /^ndekọ ọnụnọ$/i },
];

async function setLanguage(page: Page, code: string) {
  await page.addInitScript((value) => {
    localStorage.setItem('tiny-web-demo-mode', '1');
    localStorage.setItem('tiny-tour-teacher-v1', '1');
    localStorage.setItem('tiny-tour-guardian-v1', '1');
    localStorage.setItem('tiny-web-language', value);
  }, code);
}

for (const language of languages) {
  test(`captures ${language.name} screens and checks overflow`, async ({ page }, testInfo) => {
    await setLanguage(page, language.code);
    const prefix = `${testInfo.project.name}-${language.code}`;

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(language.home);
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(language.code));
    await page.screenshot({ path: `../artifacts/web/i18n/${prefix}-home.png`, fullPage: testInfo.project.name.startsWith('desktop') });

    await page.goto('/classes/class_p4_blue', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'P4 Blue', exact: true })).toBeVisible();
    await page.screenshot({ path: `../artifacts/web/i18n/${prefix}-class.png`, fullPage: testInfo.project.name.startsWith('desktop') });

    await page.goto('/attendance/class_p4_blue', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(language.attendance);
    await page.screenshot({ path: `../artifacts/web/i18n/${prefix}-attendance.png`, fullPage: testInfo.project.name.startsWith('desktop') });

    await page.goto('/help', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(language.help);
    await page.screenshot({ path: `../artifacts/web/i18n/${prefix}-help.png`, fullPage: testInfo.project.name.startsWith('desktop') });

    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(language.settings);
    await page.screenshot({ path: `../artifacts/web/i18n/${prefix}-settings.png`, fullPage: testInfo.project.name.startsWith('desktop') });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('language switch updates the rendered interface immediately and persists', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tiny-web-demo-mode', '1');
    localStorage.setItem('tiny-tour-teacher-v1', '1');
    localStorage.setItem('tiny-tour-guardian-v1', '1');
  });
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('tiny-web-language', 'en'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByLabel(/teacher language/i).selectOption('yo');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Àwọn àṣàyàn rẹ');
  await expect(page.locator('html')).toHaveAttribute('lang', 'yo-NG');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Àwọn àṣàyàn rẹ');
  await expect(page.locator('html')).toHaveAttribute('lang', 'yo-NG');
});
