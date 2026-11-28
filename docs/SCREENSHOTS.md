# Tiny — Visual Evidence Index

**Status:** 28 November 2026. Screenshots are captured from the working applications with synthetic data. No mockup is presented as a screenshot.

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

Responsive and intelligence evidence in `artifacts/web/`:

- `desktop-chromium-home.png`, `desktop-chromium-class.png`
- `mobile-chromium-home.png`, `mobile-chromium-class.png`
- `tablet-chromium-home.png`, `tablet-chromium-class.png`
- `desktop|tablet|mobile-chromium-pupils.png` (canonical directory with evidence status)
- `desktop|tablet|mobile-chromium-pupil-profile.png` (Amina: attendance, assessments, observations, follow-ups, AI diagnostics)
- `desktop|tablet|mobile-chromium-class-intelligence.png` (P4: 79% / 61% / plant-parts gap / Ngozi improving)
- `desktop|tablet|mobile-chromium-followups.png`
- `desktop|tablet|mobile-chromium-intelligence.png`
- `tiny-web-ai-cloud.png` (hosted AI result with SDK-reported Cloud Gemini)

`web/e2e/visual.spec.ts` regenerates these; `web/e2e/tiny.spec.ts` runs a desktop axe sweep over the five new surfaces.

## 2. Android application

Directory: `artifacts/emulator/`

Latest canonical local-demo evidence: run [46095208807](https://github.com/onyebuchidaniel60/tiny/actions/runs/46095208807). The app was built without `google-services.json`, so Room seeded the canonical Kofar Primary workspace: 2 classes, 8 pupils, 3 pupils needing attention and 4 open follow-ups. The script clears stale PNGs before each run. It captures:

- Onboarding language screen and welcome screen
- Home with the canonical evidence summary
- Classes and class detail
- Pupil profile and evidence (Amina)
- Class intelligence (P79% attendance, 61% assessment, plant-parts gap)
- Attendance, lessons and AI fallback
- Messages and conversation
- Pupils directory, follow-ups and pupil intelligence
- Settings
- Per-language Home and Settings screenshots: `tiny-i18n-<language>-home.png`, `tiny-i18n-<language>-settings.png`

Curated in `artifacts/emulator/`:

- `tiny-01-language.png` … `tiny-12-followups.png`
- `tiny-05a-pupil-profile.png`, `tiny-05b-pupil-evidence.png`, `tiny-05c-class-intelligence.png`
- `tiny-11-pupils.png`, `tiny-11a-pupil-intelligence.png`, `tiny-12-followups.png`
- `tiny-i18n-{en,ha,yo,ig}-home.png` and `tiny-i18n-{en,ha,yo,ig}-settings.png`
- `tiny-ai-cloud.png` (older authenticated cloud-AI evidence retained separately)

The separate authenticated smoke run [46094080588](https://github.com/onyebuchidaniel60/tiny/actions/runs/46094080588) still proves test-phone sign-in against the non-production Firestore bootstrap, but that remote workspace is the older one-class synthetic workspace. The canonical screenshots therefore come from the local-demo build, which is the intended canonical demo path.

**Physical-device screenshots are not claimed.** The operator’s Samsung Galaxy Note 10+ (Android 12) requires a manual installation from the public APK; no device was connected to this session. On-device Gemini Nano is not supported on that device.

## 3. Landing page

`artifacts/screenshots/landing-desktop-full.png`, `landing-mobile-top.png`, `landing-mobile-revealed.png` are the earlier local landing captures. The landing page is a separate static surface and is not part of the hosted teacher app; see `landing/README.md`. No new public landing URL is claimed.

## 4. How to regenerate web evidence

```powershell
cd web
npm run build
npx playwright test e2e/i18n-visual.spec.ts e2e/visual.spec.ts
```

## 5. How to regenerate Android evidence

Trigger the `android-ci` workflow manually after the build job succeeds. The manual emulator job downloads `tiny-dev-debug-apk`, launches an API 35 Pixel 5 profile, captures screenshots and uploads `tiny-emulator-evidence`.

## 6. Redaction

- Synthetic names and test numbers only.
- No OTP, secret, App Check token, service-account JSON or private URL is shown.
- Logcat is redacted for App Check debug tokens before upload.
- No real pupil, guardian or school data is used.
