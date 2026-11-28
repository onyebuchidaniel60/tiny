# Tiny — Final Implementation Report

**Date:** 28 November 2026  
**Repository:** <https://github.com/onyebuchidaniel60/tiny>  
**Hosted teacher preview:** <https://tiny-b9f29.web.app>  
**Submission status:** implementation complete for the tested scope; public YouTube upload, Devpost entry and eligibility confirmation remain operator actions. The Devpost deadline is **30 November 2026, 22:00 UTC**.

---

## 1. Executive summary

Tiny is a native Android teacher workspace for a Nigerian primary school. It is offline-first, uses an encrypted local database as the working source of truth, and treats parent communication as SMS to ordinary phones. Pupils have no account or app. A browser companion preview mirrors the teacher workflows for evaluation and uses the same canonical synthetic workspace.

The central product capability added in this pass is **evidence-backed pupil and class intelligence**:

- Attendance, assessment and teacher-observation records are captured on both platforms.
- A deterministic engine calculates attendance rates, assessment averages/trends, class gaps, attention/improving pupils, "strength" evidence and follow-up suggestions.
- Every pupil or class insight carries traceable evidence IDs and an evidence fingerprint.
- Optional Firebase AI Logic analysis receives only de-identified, minimized evidence, and the UI always displays the SDK-reported inference source.
- The teacher can record a follow-up, generate a parent-update draft, or create an evidence-informed lesson; nothing parent-facing is sent automatically.

The Android and web apps use the same workspace, classes, eight pupils, guardians, attendance dates, assessments, observations, follow-ups, lessons and messages through stable identifiers. A CI guard fails if those canonical IDs drift.

## 2. Capabilities

### Android (native product)

- Firebase Phone Authentication for teachers; synthetic test numbers only.
- Encrypted Room database (SQLCipher + Android Keystore) with migration from schema 1 to 2.
- Workspaces, multiple classes, pupils, guardians/links, attendance, assessments, 5E lessons, progress/observations, follow-ups, conversations/messages.
- WorkManager-backed durable outbox, idempotent command transport, retry/backoff and conflict mapping.
- Pupil directory and profile, class intelligence, follow-up list and intelligence diagnostics.
- Optional Firebase AI Logic with `PREFER_ON_DEVICE`, `ONLY_IN_CLOUD`, `ONLY_ON_DEVICE` and `PREFER_IN_CLOUD` where supported.
- Local sample reset/reseed from Settings.
- English/Hausa/Yoruba/Igbo resources, accessibility semantics, light-first Material 3 theme.

### Web companion

- Teacher-only React 19/Vite app; no parent/pupil account.
- Local-first IndexedDB + localStorage recovery, PWA service-worker shell.
- Firebase Auth preview account, member-scoped Firestore read bootstrap, App Check debug token in the hosted preview.
- Attendance draft/submit, lessons, progress/approval, assessments, follow-ups, pupil directory/profile, class intelligence, messages and a synthetic guardian SMS simulator.
- Evidence review/diagnostics, parent draft, evidence-informed lesson generation.
- Responsive desktop/tablet/mobile layout, four languages, axe-checked accessibility.

### Shared backend (emulator-only under Spark)

- TypeScript Cloud Functions 2nd gen: auth/membership/class checks, attendance/absence jobs, guardian verification, progress revisions/approval, messages, assessment/lesson/follow-up commands, idempotent sync receipts, HMAC-verified SMS webhooks, weekly digest scheduler.
- Firestore rules deny direct client writes to authoritative collections.
- Contract and emulator tests; no hosted deployment and no live SMS.

## 3. Intelligence architecture

```text
Recorded facts                 Deterministic engine                 Teacher decision
attendance entries   ─┐
assessment scores     ├──▶  rates, trends, gaps, status,    ───▶  review, follow-up,
teacher observations  │      confidence, next actions             parent draft, lesson
follow-ups            ─┘                                             │
                                                                     ▼
                                                     Optional AI interpretation
                                                     (de-identified evidence only,
                                                      SDK-reported source,
                                                      teacher approves)
```

Rules (implemented identically in `web/src/intelligence.ts` and `core/intelligence/IntelligenceEngine.kt`):

- **Insufficient:** fewer than 3 attendance marks, fewer than 2 assessments and no observations.
- **Needs attention:** attendance below 75%, assessment average below 45%, or 2+ `needs_support` observations.
- **Improving:** assessment trend of at least +8 points, or a recent positive observation after support.
- **Strong:** attendance ≥90%, assessment average ≥75%, and no support observations.
- **Making progress:** evidence exists but no higher-priority condition holds.
- **Confidence:** high only with ≥10 records, ≥2 assessments and ≥2 observations; medium with ≥4 records; otherwise low.

The status cannot be edited directly. The teacher inspects and corrects the source records.

## 4. AI evidence and safety

- Android and web call Firebase AI Logic at runtime. Android uses the hybrid Android SDK; the web uses the Firebase Web AI SDK. Versions are pinned in Gradle/npm.
- The request can select a mode, but the **displayed source** always comes from the SDK response (`ON_DEVICE`, `IN_CLOUD`, or unknown). It is never inferred from configuration or the requested mode.
- Verified result in this environment: **cloud inference, source `Cloud Gemini`**. On-device Gemini Nano is **not claimed**: the supplied Samsung Galaxy Note 10+ (Android 12) is not a supported Nano device, and no supported physical device was tested. The emulator test asserted Nano was unavailable and the SDK fell back to cloud.
- Evidence-backed prompts redact pupil/guardian names, phone numbers and emails; they contain only aggregates, objective labels, scores and redacted observation text. No messages, photos, diagnoses or family details are sent.
- The deterministic review, parent draft and lesson plan are always available offline. AI fallback text is explicitly labelled as not a model response.
- AI output is a draft. The teacher must review it; the parent draft still enters a mock outbox and is not sent automatically.
- AI analyses are stored locally with evidence IDs, fingerprint, requested mode, actual source, duration and fallback flag. They are not shared authoritative school records.
- No raw prompts, OTPs, phone numbers or message bodies are written to production logs.

See `docs/AI_HYBRID_VERIFICATION.md`.

## 5. Defects found and fixed in this pass

| Defect | Fix | Verification |
|---|---|---|
| Web and Android seeds used different pupils/classes | Canonical `ws_kofar_primary` dataset on both; CI drift guard | `tools/check-canonical-dataset.mjs`; 29 web unit, 41 Android JVM |
| No assessment/follow-up/evidence model | Room v2 migration + web types + shared commands | Emulator E2E 11/11; Android compile/tests |
| Pupil/class insights were not traceable | Evidence IDs, fingerprints, source records, deterministic summaries | Intelligence tests on both platforms |
| AI source could be confused with requested mode | UI/store requested mode separately from SDK source | AI service tests; diagnostics screen |
| Web refresh could discard locally pending evidence | `mergePending` keeps pending local records and unrelated remote records | Typecheck + store behavior; documented |
| Web attention pills failed WCAG contrast | `--bad-text` token for pill text | Axe: 0 serious/critical |
| Android Compose called `stringResource` in non-composable lambdas | Moved labels into composable scope / resource-ID helpers | Android CI compile |
| Android Room schema changed without migration | `MIGRATION_1_2` creates assessments/follow-ups/AI tables and indexes | Android build + JVM tests |
| Web displayed raw decimals and singular/plural errors | Whole-number shared engine values; plural keys | Web tests; screenshots |
| Mobile card headings squeezed action labels | Wrapping card headings; 2×2 then 1-column metrics | Mobile screenshots |
| Android bottom-nav coordinates in smoke script assumed four tabs | Updated to five-tab centers and new routes | Script review; next smoke run |
| CI APK signing identity changed on every runner | Optional stable debug keystore + `apksigner`/`zipalign` verification | Workflow verification step |

## 6. Light-first redesign

- Android defaults to `TinyTheme(darkTheme = false)`; the dark palette remains available but is not the system-following default.
- Web is light-first with warm paper, forest primary actions and coral attention states. Status is never communicated by colour alone.
- New hierarchy: status hero → evidence metrics → source detail → strengths/needs/next actions → follow-ups → optional AI → parent draft.
- Five teacher destinations on mobile: Home, Classes, Pupils, Messages, Intelligence. Follow-ups and class overview are one tap away.
- AI cards are visually secondary to recorded evidence; every AI result shows source, duration, evidence summary and fallback state.
- Screenshots: `artifacts/web/*-pupils.png`, `*-pupil-profile.png`, `*-class-intelligence.png`, `*-followups.png`, `*-intelligence.png` at desktop/tablet/mobile; 60 localized screenshots remain in `artifacts/web/i18n/`.

See `docs/DESIGN_NOTES.md`, `docs/DESIGN_SYSTEM.md`, `docs/SCREENSHOTS.md`.

## 7. Android/Web Data Consistency and Synchronization

### Canonical synthetic workspace

| Item | Value |
|---|---|
| Workspace | `ws_kofar_primary` · Kofar Primary · school code `KOFAR001` |
| Classes | 2 — `class_p4_blue` (P4 Blue), `class_p5_gold` (P5 Gold) |
| Pupils | 8 — `pupil_amina`, `pupil_musa`, `pupil_ngozi`, `pupil_tunde`, `pupil_fatima`, `pupil_emeka`, `pupil_zainab`, `pupil_ibrahim` |
| Guardians | 4, including one endpoint shared by three pupils |
| Attendance | 7 submitted dates per class, 14 sessions, 56 entries |
| Assessments | 24 (3 per pupil) across four objectives |
| Observations | 10 teacher-authored progress records |
| Follow-ups | 4 open evidence-linked records |
| Lessons | 3 complete 5E plans |
| Messages | 2 conversations, 3 mock messages |
| Teacher persona | Ms. Bello |

Full tables, histories and expected derived values: `shared/demo/CANONICAL_DATASET.md`.

### Schema and identifiers

Firestore collections and Room tables share the same logical fields and stable prefixes (`ws_`, `class_`, `pupil_`, `guardian_`, `link_`, `assessment_`, `followup_`, `lesson_`, `conversation_`, `msg_`). Attendance session IDs are deterministic (`classId_YYYY-MM-DD`). Documented field-name mappings: Android `label` ↔ `sectionLabel`, `localCode` ↔ `localPupilCode`, `topic` ↔ `title`. Full contract: `docs/CROSS_PLATFORM_SYNC.md` and `docs/DATA_MODEL.md`.

### Supported synchronization architecture

- Firestore is the intended shared store; server-side callables are the only accepted writers.
- Both clients keep a durable outbox with per-command idempotency keys and preserve failed/conflicting rows.
- `syncCommands` validates Auth, App Check (outside emulator), membership, class access, schema, state and idempotency, and applies commands through the same handlers as direct callables.
- Accepted commands receive a per-workspace receipt; replay returns `alreadyApplied`.
- Conflict handling: duplicate attendance/date, class identity clash, stale progress revision, stale assessment/lesson/follow-up `expectedVersion`. Conflicts do not overwrite the stored record.
- Web remote refresh merges by ID and keeps local rows that are still pending; unrelated remote records always survive.

### What is verified, and where

| Operation | Supported path | Evidence |
|---|---|---|
| Local attendance, lessons, observations, assessments, follow-ups | Room/IndexedDB, offline first | Playwright offline reload; Android sync retry tests |
| Web-created class/pupil/attendance/progress/message/assessment/lesson/follow-up command shapes | Functions emulator | `functions/src/emulator.e2e.test.ts` 11/11; shared command validators |
| Android-created class/pupil via real Firebase SDK | Auth/Firestore/Functions emulators | Manual `SyncEmulatorE2ETest` (accepted, replay, retry, conflict) |
| Android-created assessment/lesson/follow-up via outbox | Same command contract | Repository enqueues payloads; Functions suite covers handlers |
| Web reads shared collections after remote change | Firestore read bootstrap | Mapping + merge code; deployed read-only bootstrap previously verified |
| Same pupil/class intelligence numbers | Deterministic engines | 29 web unit tests + 41 Android JVM tests |
| Firebase deployed cross-device write sync | **Not available on Spark** | Functions cannot deploy without Blaze |

### Exact cross-platform results

- **Verified:** canonical IDs/classes/pupils/dates; identical deterministic rates/statuses; web command contract accepted by the emulator; Android real-SDK transport accepted/replayed/retried/conflicted; idempotent attendance and receipt replay; offline durability; conflict preservation.
- **Not run end-to-end:** one browser session and one Android session simultaneously editing the same deployed workspace and observing each other after a remote refresh. This requires deployed Functions or a fully orchestrated two-client emulator harness; the command contract is verified, but the UI-to-UI loop is not claimed.
- **Blocked by Spark:** deployed `syncCommands`, hosted absence jobs, live cross-device refresh of client writes.
- **Additional honest limitation:** the existing non-production Firestore preview workspace is the legacy synthetic `ws_webdemo0001`, read-only. The canonical workspace is used by the Android seed and the web offline demo, and by emulator tests. Migrating the preview workspace needs an authorized admin write; it is not hidden or presented as canonical.

## 8. Test evidence

| Suite | Result | Where |
|---|---:|---|
| Web unit/component (Vitest) | **29 passed, 0 failed** (7 files) | web CI |
| Web browser journeys (Playwright) | **40 passed, 0 failed, 5 skipped** across desktop/tablet/mobile | web CI |
| Web accessibility (axe WCAG 2 A/AA) | **0 serious/critical** on Home + 5 intelligence surfaces | web CI |
| Android JVM unit tests | **41 passed, 0 failed** | android CI |
| Functions domain tests | **19 passed, 0 failed** | android CI |
| Firestore rules tests | **9 passed, 0 failed** | android CI emulator job |
| Backend emulator E2E (callables, webhook, scheduler, sync) | **11 passed, 0 failed** | android CI emulator job |
| Android lint + debug APK | passed | android CI |
| Compose instrumentation journey | passed | android CI emulator |
| APK signature/alignment verification | `apksigner` + `zipalign` | android CI artifact |
| Canonical dataset guard | passed (20 Android IDs shared with web) | both workflows |
| Translation guard | **880 keys × 4 languages**, 0 hardcoded UI strings | both workflows |

The skipped browser tests are the three opt-in live Firebase/AI checks plus two non-desktop duplicate axe sweeps.

Latest evidence links are recorded in `docs/BUILD_LOG.md` and `AI_HANDOFF.md`.

## 9. Build, APK and install findings

- The debug APK is about **31 MB**; installation time on a slow USB connection is dominated by copying and signature verification, not compilation.
- CI debug builds previously received a **new debug signing key on every runner**, causing `INSTALL_FAILED_UPDATE_INCOMPATIBLE` when a newer CI APK was installed over an older one. The workflow now supports a stable debug keystore from secrets and always prints:
  - `apksigner verify --verbose --print-certs`
  - `zipalign -c -v 4`
  - APK size and SHA-256
- Without the optional stable keystore, uninstall the old debug package before installing a new CI APK. Never disable signature verification.
- The public judge APK is debug-signed with a dedicated App Check debug token and synthetic data only. Current release: [v0.1.0-preview.3](https://github.com/onyebuchidaniel60/tiny/releases/tag/v0.1.0-preview.3), `tiny-judge-preview.apk`, 31,819,671 bytes, SHA-256 `a8cd734a95ce50349fb7ec3140df3585bf05e847d0edcde8acb045536074610d`.
- **Physical Samsung Galaxy Note 10+ install/testing was not performed** in this environment. It is not a supported Gemini Nano device. See `docs/CI_ANDROID_BUILD.md` and `docs/TROUBLESHOOTING.md`.

## 10. Documentation and repository

Key documents:

- `shared/demo/CANONICAL_DATASET.md` — the school, people, records and derived values.
- `docs/CROSS_PLATFORM_SYNC.md` — schema, commands, conflicts and exact verified/blocked matrix.
- `docs/DATA_MODEL.md` — entity dictionary and Firestore layout.
- `docs/API.md` — callables, sync commands and error behaviour.
- `docs/AI_HYBRID_VERIFICATION.md` — hybrid modes, source evidence and device procedure.
- `docs/DESIGN_NOTES.md` — light-first/information architecture and screenshots.
- `docs/TESTING.md` — test matrix and counts.
- `docs/SCREENSHOTS.md` — visual evidence index.
- `docs/CI_ANDROID_BUILD.md` — build, signing and install reliability.
- `AI_HANDOFF.md` and `docs/BUILD_LOG.md` — state and chronological evidence.
- `README.md` — setup, capabilities and links.

Commits in this pass:

- `680236a` — evidence-backed pupil/class intelligence and canonical data.
- `ccdc66e` — Compose composable-label fix.
- `5523846` — WCAG contrast fix.
- `5cda33b` — unified cross-platform dataset/sync contract, command handlers and tests.
- `53b34fa` — intelligence UI polish, CI dataset/signing guards and docs.

## 11. Remaining limitations

1. **On-device Gemini Nano** is not verified; no supported physical device. Cloud fallback is verified and honestly labelled.
2. **Deployed cross-device sync** is blocked by Spark + emulator-only Cloud Functions. The tested contract and emulator path are documented; no fake cloud claim.
3. **Legacy Firestore preview workspace** (`ws_webdemo0001`) cannot be migrated to canonical IDs without an authorized admin write.
4. **SMS is mocked.** No live eSMS send, no real parent number, no delivery claim. Provider `accepted` would not equal delivered.
5. **Physical-device installation, TalkBack, low-end performance and native Hausa/Yoruba/Igbo review** remain operator/device gates.
6. **App Check enforcement and Play Integrity** are configured but not enforced for release.
7. **Public YouTube upload and Devpost submission** are not done.

## 12. Hackathon readiness

**Strong:**

- Working Android app and hosted browser companion with the same synthetic school.
- Real Firebase Auth/Firestore/AI Logic calls, SDK-reported source, App Check debug flow.
- Evidence-backed intelligence is a substantive AI-for-education use case, not a generic chatbot.
- Offline-first core, privacy controls, teacher review, honest fallback.
- Extensive automated tests, CI evidence, documentation and screenshots.

**Hard submission gates (operator):**

1. Confirm eligibility, age, residence and IP ownership.
2. Upload the reviewed ≤180s MP4 to YouTube as public with English captions.
3. Publish/confirm the judge APK release and keep it available through 16 December 2026.
4. Keep the hosted preview and synthetic account live; revoke debug tokens after judging.
5. Complete the Devpost entry before **30 November 2026, 22:00 UTC**.

The honest hybrid-AI gap remains on-device execution. The submission should disclose it and provide the supported-device acceptance procedure; it must not claim Nano ran on the Note 10+.
