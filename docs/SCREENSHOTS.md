# Tiny — Visual Evidence Index

**Status:** 27 November 2026. Screenshots are captured from the working applications with synthetic data. No mockup is presented as a screenshot.

## 1. Web application

Directory: `artifacts/web/i18n/`

Each language (`en`, `ha`, `yo`, `ig`) has captures for:

- Home (`*-home.png`)
- Class detail (`*-class.png`)
- Attendance (`*-attendance.png`)
- Help centre (`*-help.png`)
- Settings (`*-settings.png`)

Viewports:

- Desktop Chromium 1440 × 1000
- Tablet Chromium 820 × 1180
- Mobile Chromium Pixel 5 (393 × 851)

File pattern: `<viewport>-chromium-<language>-<screen>.png`.
Total: **60** screenshots (4 languages × 3 viewports × 5 screens).

The Playwright test `web/e2e/i18n-visual.spec.ts` regenerates them and asserts that the document does not overflow horizontally at every captured language/viewport.

Earlier responsive evidence remains in `artifacts/web/`:

- `desktop-chromium-home.png`, `desktop-chromium-class.png`
- `mobile-chromium-home.png`, `mobile-chromium-class.png`
- `tablet-chromium-home.png`, `tablet-chromium-class.png`
- `tiny-web-ai-cloud.png` (hosted AI result with SDK-reported Cloud Gemini)

## 2. Android application

Directory: `artifacts/emulator/`

The manual `android-ci` emulator job runs `tools/android-emulator-smoke.sh` and captures:

- Onboarding language screen and welcome screen
- Auth gate (Firebase-configured build)
- Authenticated Home after a test-phone sign-in
- Classes, class detail, progress, family contacts
- Attendance, lessons and AI fallback
- Messages and conversation
- Settings
- Per-language Home and Settings screenshots: `tiny-i18n-<language>-home.png`, `tiny-i18n-<language>-settings.png`

Existing evidence from the previous checkpoint remains until the new manual run replaces it:

- `tiny-01-language.png` … `tiny-10-settings.png`
- `tiny-04-authenticated.png`
- `tiny-ai-cloud.png`

**Physical-device screenshots are not claimed.** The operator’s Samsung Galaxy Note 10+ (Android 12) requires a manual installation from the public APK; no device was connected to this session. On-device Gemini Nano is not supported on that device.

## 3. Landing page

`artifacts/screenshots/landing-desktop-full.png`, `landing-mobile-top.png`, `landing-mobile-revealed.png` are the earlier local landing captures. The landing page is a separate static surface and is not part of the hosted teacher app; see `landing/README.md`. No new public landing URL is claimed.

## 4. How to regenerate web evidence

```powershell
cd web
npm run build
npx playwright test e2e/i18n-visual.spec.ts
```

## 5. How to regenerate Android evidence

Trigger the `android-ci` workflow manually after the build job succeeds. The manual emulator job downloads `tiny-dev-debug-apk`, launches an API 35 Pixel 5 profile, captures screenshots and uploads `tiny-emulator-evidence`.

## 6. Redaction

- Synthetic names and test numbers only.
- No OTP, secret, App Check token, service-account JSON or private URL is shown.
- Logcat is redacted for App Check debug tokens before upload.
- No real pupil, guardian or school data is used.
