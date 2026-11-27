# Tiny — Localization

**Status:** 27 November 2026. The localization architecture is complete on Android and web. English is the source language. Hausa, Yoruba and Igbo have complete draft coverage and are **not yet native-reviewed**.

## 1. Root cause of the old partial translation

The old Android app had four `strings.xml` files but only about 14 translated keys per language. Most Compose screens contained English literals directly, and snackbar messages were assembled as English strings inside `TinyViewModel`. The web application had no localization layer at all: every page, dialog, validation message and empty state was hardcoded in English, while the Settings selector changed only a language value that no screen consumed.

This was an architectural defect, not a missing-label defect. Patching individual visible strings would have left dialogs, errors, notifications and reuse components in English.

## 2. Single source of truth

```
shared/i18n/en.json
shared/i18n/ha.json
shared/i18n/yo.json
shared/i18n/ig.json
        │
        ├── tools/generate-i18n.mjs ──► app/src/main/res/values*/strings.xml
        │                              └► web/src/i18n/dictionaries.ts
        │
        ├── app localization test (key + placeholder parity)
        └── web Vitest + CI checks
```

- 754 keys per language.
- Every key has a non-empty value in all four languages.
- Interpolation placeholders must match the English source exactly (`{name:s}`, `{count:d}`).
- Plural keys are pairs (`*_one`, `*_other`) and are generated as Android `<plurals>` and web plural helpers.
- The generator rejects invalid Android names, including reserved Java keywords such as `class`.
- CI runs `node tools/generate-i18n.mjs --check`; stale generated resources fail the build.
- `tools/check-ui-strings.mjs` rejects new visible text/attributes that bypass the translation resources.

## 3. Runtime behaviour

### Android

- `AppCompatDelegate.setApplicationLocales` applies the selected locale immediately and recreates the activity.
- The language is mirrored to a small `SharedPreferences` file so a cold start loads the right resources before Compose begins.
- `android:localeConfig` exposes English, Hausa, Yoruba and Igbo to Android 13+ system per-app language settings.
- Snackbar messages are `UiMessage` resource IDs resolved at render time, not English strings created in the ViewModel.
- Dates use `LocalConfiguration.current.locales[0]` inside composition, avoiding the Compose non-observable-locale lint error.
- The language chooser is available during onboarding and in Settings; changing it does not require a restart.

### Web

- `I18nProvider` owns the language state, persists it to `localStorage` (`tiny-web-language`), updates `<html lang>` and `document.title`, and re-renders the visible tree immediately.
- The language selector is in the top bar and Settings. A changed language survives a refresh.
- `Intl` formats numbers/times. For Hausa, Yoruba and Igbo, dates are shown in an unambiguous numeric format because Chromium's ICU data does not consistently provide month/weekday names for those locales; this avoids an English-word fallback.
- All pages, dialogs, validation, empty states, status pills, tooltips, accessibility labels, tours and Help articles use the dictionary.
- Missing keys fall back to English and warn in development. The CI parity test makes a missing key a failure before release.

## 4. Coverage status

| Language | UI keys | Translation status | Native review | Notes |
|---|---:|---|---|---|
| English (`en`) | 754 | Complete, source | N/A | Reference language |
| Hausa (`ha`) | 754 | Complete draft | **Pending** | Standard Hausa educational terms used consistently; review punctuation and specialist terms |
| Yoruba (`yo`) | 754 | Complete draft | **Pending** | Diacritics included; review tone marks and technical terms |
| Igbo (`ig`) | 754 | Complete draft | **Pending** | Standard Igbo terms used; review dialect/terminology choices |

**Do not describe Hausa, Yoruba or Igbo as “verified” or “fully reviewed”.** The UI discloses “Draft translation · native review pending” where the choice is made. The 754-key parity guarantee means there is no untranslated-key gap; it does not replace human language review.

## 5. Screens and components covered

Authentication, onboarding, language selection, Home/dashboard, Classes, class detail, pupil registration, Attendance and history, Lessons and 5E detail, Progress and approvals, Guardians and consent, Messages and conversations, Sync centre, Settings, AI Teaching Assistant, Help centre, teacher tour, guardian guide, empty/loading/success/error/offline states, dialogs, validation and accessibility descriptions.

## 6. Tests

- `LocalizationTest` (Android JVM): every language has the same string/plural keys and placeholders; core classroom vocabulary exists.
- `web/src/i18n/i18n.test.tsx`: catalogue parity, placeholder parity, immediate re-render, persistence and locale-aware date/plural output.
- `web/e2e/i18n-visual.spec.ts`: every language at desktop, tablet and mobile widths; checks no horizontal overflow and captures Home, class, attendance, Help and Settings screenshots.
- Visual evidence: `artifacts/web/i18n/` (48 screenshots across 4 languages × 3 viewports × 4 representative screens, plus additional captures). Android evidence is captured by `tools/android-emulator-smoke.sh` when the manual emulator job runs.

## 7. Adding a string

1. Add the key to all four files in `shared/i18n/`.
2. Use the same placeholders in every language.
3. Run `node tools/generate-i18n.mjs`.
4. Run `node tools/generate-i18n.mjs --check` and `node tools/check-ui-strings.mjs`.
5. Reference `t('key')` on web or `stringResource(R.string.key)` on Android.
6. Do not add a raw English literal to a screen, dialog or snackbar.

## 8. Known localization limitations

- Native review is the remaining content-quality gate for Hausa, Yoruba and Igbo.
- Browser date names fall back to numeric dates for ha/yo/ig because of ICU coverage; Android uses the platform locale data.
- AI model output is English and teacher-reviewed; it is not presented as a verified translation. The offline teaching ideas are localized.
- Parent SMS templates are a separate backend concern and are not exercised by the hosted web/Android preview; only local UI strings are covered by this document.
- `pcm` (Nigerian Pidgin) is a parent-SMS language, not a teacher UI language, and is not offered in the app selector.
