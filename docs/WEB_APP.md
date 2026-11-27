# Tiny - Browser Companion Preview

**Status:** implemented, deployed and verified on 27 November 2026.

**Preview URL:** <https://tiny-b9f29.web.app>

**Scope:** an operator-requested browser companion for evaluating Tiny's teacher workflows without installing the Android app. The native Android teacher app remains the product. The browser preview does not create a parent account, pupil account or student app, and it does not replace the Android app's encrypted local database or its phone-first authentication.

## 1. What it is and is not

The browser preview is a functional companion to the Android app, not a landing page or a static mockup.

It provides:

- Firebase sign-in for a synthetic preview account.
- A read-only Firestore bootstrap of the existing Tiny workspace data model.
- Teacher workflows for classes, pupils, attendance, lessons, progress, guardians and messages.
- Local IndexedDB persistence, in-progress drafts, a durable local outbox and honest pending/retry/conflict states.
- A synthetic SMS-style guardian view for testing two-way messaging without a parent account or a real phone.
- Firebase AI Logic with on-device preference, cloud fallback, SDK-reported inference source and a curated offline fallback.
- A responsive desktop, tablet and mobile layout with accessibility controls.
- A bundled PWA service worker for app-shell offline use after the first visit.

It is not:

- A production product or an authorization to process real pupil or guardian data.
- A parent portal, parent login or student interface.
- A live SMS client. Nothing is sent to a real phone.
- A replacement for Firebase Cloud Functions. Functions remain emulator-only under Spark/NGN 0.
- A cross-device synchronization service. Writes remain on the device that made them.
- Evidence of on-device Gemini Nano inference. The available browser reported cloud inference; see section 8.

## 2. Access

Open <https://tiny-b9f29.web.app>.

Synthetic Firebase preview account:

- Email: `judge@tiny-demo.example`
- Password: `TinyDemo2026!`

The account, workspace, pupils, guardians, lessons, messages and phone numbers are synthetic. Do not reuse the password for any other account and do not enter real child, guardian or school data.

The preview also offers **Continue in offline demo**, which uses the bundled synthetic workspace without Firebase. It is useful for testing IndexedDB and PWA behavior without a network.

## 3. Routes and user journeys

| Route | Purpose |
|---|---|
| `/` | Teacher home; classes, attendance status, messages, pending work |
| `/classes` | Multiple classes and local class creation |
| `/classes/:classId` | Roster, pupil registration, register history, class lessons |
| `/attendance/:classId` | Full-roster attendance, draft save, submit, local history |
| `/lessons` | 5E lesson list and local lesson creation |
| `/lessons/:lessonId` | Editable 5E plan saved offline |
| `/progress/:pupilId` | Teacher-authored observations, approval, home activity |
| `/messages` | Guardian conversation inbox |
| `/messages/:conversationId` | Conversation thread and queued teacher reply |
| `/guardians` | Guardian endpoints, consent state, pupil links |
| `/sync` | Connectivity, outbox, retry and honest sync availability |
| `/settings` | Account, accessibility, privacy, local reset |
| `/ai` | De-identified teaching strategy, model source and curated fallback |
| `/guardian/:conversationId` | Synthetic SMS simulator; not a parent account |

Verified journeys:

1. Sign in with the synthetic Firebase account, or enter the offline demo.
2. Read the seeded Firebase workspace and see the same classes/pupils as the Android data model.
3. Create a class and a pupil; both survive a page refresh.
4. Mark every pupil in a register, submit it, reload the page and confirm the register persists.
5. Save a lesson, edit it and confirm it remains available offline.
6. Record progress, approve it locally and see the approval state and revision.
7. Queue a teacher reply, open the guardian simulator, send a synthetic guardian message, and see it in the teacher conversation.
8. Add a guardian and link one endpoint to multiple pupils.
9. Go offline, confirm the offline banner, reload with the service worker active, and confirm local state survives.
10. Generate an AI strategy and read the actual SDK source. The verified source in this environment was `Cloud Gemini`.
11. Toggle large text and reduced motion; use the mobile bottom navigation and topbar Settings shortcut.

## 4. Architecture

```
Browser
  React 19 + TypeScript + Vite
    |
    +-- Firebase Web SDK
    |     +-- Auth (synthetic email/password preview)
    |     +-- Firestore (member-scoped read bootstrap)
    |     +-- App Check (revocable web debug token)
    |     +-- AI Logic (PREFER_ON_DEVICE, cloud fallback)
    |
    +-- IndexedDB via idb
    |     +-- state store (single AppState record)
    |     +-- drafts store (attendance and message drafts)
    |
    +-- localStorage
    |     +-- synchronous last-state backup
    |     +-- demo-mode flag
    |
    +-- PWA service worker
          +-- app-shell precache
          +-- SPA navigation fallback
```

Key files:

| File | Responsibility |
|---|---|
| `web/src/App.tsx` | Auth gate, routes, teacher shell, responsive navigation |
| `web/src/data/store.tsx` | Local state, outbox, Firestore bootstrap, messaging, sync behavior |
| `web/src/data/db.ts` | IndexedDB and localStorage persistence |
| `web/src/firebase/config.ts` | Firebase app, lazy Auth, Firestore, Functions, App Check |
| `web/src/firebase/auth.tsx` | Preview sign-in and offline-demo mode |
| `web/src/ai/service.ts` | Firebase AI Logic call, source reporting and curated fallback |
| `web/src/styles.css` | Responsive design system |
| `web/e2e/tiny.spec.ts` | Browser journeys, offline recovery and accessibility |
| `web/e2e/firebase-live.spec.ts` | Optional live Firebase/AI source check |
| `.github/workflows/web-ci.yml` | Typecheck, unit, build, Playwright and evidence upload |

The browser app reuses the product's existing Firestore collection names and field meanings. It does not introduce a second backend or a competing data model.

## 5. Authentication and data access

### Preview authentication

Firebase Authentication has the Email/Password provider enabled for the web preview. The synthetic account is a member of workspace `ws_webdemo0001` and has UID `wT35e4yAe1PTRZ0BT6UheSsmEdg2`.

This is a preview-only access path. The production and Android product remains Firebase Phone Authentication for teachers and administrators. The browser does not receive or display real SMS OTPs.

### Firestore reads

The browser reads, after sign-in:

- `users/{uid}/workspaces` for the workspace index.
- `workspaces/{workspaceId}` and `workspaces/{workspaceId}/members/{uid}` through the rules-scoped session.
- Classes, pupils, guardians, pupil-guardian links, lesson plans, progress entries, attendance sessions/entries, conversations and messages.

Firestore rules are unchanged. A signed-in user without active workspace membership cannot read the workspace. The browser never receives or uses an administrative service account.

### Authoritative writes

The browser does **not** write authoritative Firestore collections. Local teacher edits are stored in IndexedDB and recorded in a local outbox. This is deliberate:

- Cloud Functions are emulator-only under Spark/NGN 0.
- Direct client writes to authoritative collections are denied by the existing rules.
- The UI must not show a queued local edit as synced.

When `VITE_FUNCTIONS_EMULATOR=true`, the Sync centre can send the local outbox to the local `syncCommands` Functions emulator. The hosted preview is built with `VITE_FUNCTIONS_EMULATOR=false`, so it reports that server sync is unavailable instead of pretending to sync.

## 6. Offline behavior and limitations

### What is local

- `tiny-web` IndexedDB database:
  - `state`: one versioned `AppState` record.
  - `drafts`: attendance and message drafts keyed by class/date or conversation.
- `localStorage`:
  - `tiny-web-state-v1`: synchronous last-state backup.
  - `tiny-web-demo-mode`: demo-mode selection.
  - `tiny-draft:*`: fallback draft backup if IndexedDB is unavailable.

Attendance marks and message text are written while the teacher types. A refresh, accidental tab close or offline transition does not discard the last edit.

### Outbox states

Each local command records an idempotency key, attempt count, last error and one of:

- `pending` - saved locally; no server acknowledgement.
- `retrying` / `retryable` - a previous attempt failed and may be retried.
- `synced` - only after an emulator acknowledgement in the supported local configuration.
- `failed` - rejected; the teacher must review.
- `conflict` - the server reports a conflict; the UI must not silently overwrite it.

### Offline limits

- The first visit requires a network to load the app shell and, for Firebase mode, to authenticate. The offline demo uses the bundled synthetic state.
- After the first successful visit, the service worker caches the app shell and SPA navigation. Firestore data is not a live offline replica; the last local state remains available through IndexedDB.
- A browser refresh while offline depends on the service worker having activated. The test suite waits for service-worker control before disconnecting.
- Browser storage is not encrypted. It contains synthetic data only. Do not treat it as equivalent to the Android SQLCipher store.
- Clearing site data deletes the local workspace, drafts and outbox. The Settings page offers an explicit local reset.
- Cross-device synchronization is not implemented and is not claimed.
- A hosted browser cannot call the emulator-only Functions backend.

### Service-worker updates

The PWA uses `registerType: 'autoUpdate'`, Workbox precache and an SPA navigation fallback. A browser that has an older worker may briefly serve an older cached shell while the new worker installs. If the preview appears stale:

1. Reload once and wait for the worker update.
2. Use the browser's hard reload.
3. If necessary, unregister the service worker and clear site data for `tiny-b9f29.web.app`, then reload.

This is a normal PWA cache trade-off, not evidence of a failed deployment. The hosted files can be checked directly with `https://tiny-b9f29.web.app/index.html`.

## 7. Messaging and the guardian simulator

The product's parent channel remains ordinary SMS. The browser does not create a parent login.

- The teacher inbox shows synthetic inbound messages from seeded guardian endpoints.
- A teacher reply is saved locally with status `queued`.
- The guardian simulator at `/guardian/:conversationId` is a web-only phone-shaped view. It sends a synthetic inbound message into the same local conversation.
- Tabs synchronize synthetic messages through `BroadcastChannel`. This is a browser convenience, not a server push or SMS delivery.
- Provider acceptance is never shown as delivery. The seeded provider is `mock`.

Do not interpret the simulator as evidence that eSMS, a real short code or a production SMS budget is active.

## 8. Firebase AI Logic and inference source

### Implementation

`web/src/ai/service.ts`:

- Imports `getAI`, `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode` and `InferenceSource` from `firebase/ai`.
- Uses `InferenceMode.PREFER_ON_DEVICE`.
- Sets the cloud fallback model to `gemini-3.5-flash-lite`.
- Sends a short, de-identified Primary 4 basic-science prompt with no pupil, guardian, phone, school record or diagnosis.
- Reads the source only from `response.response.inferenceSource`.
- Maps `InferenceSource.ON_DEVICE` to **On-device Gemini Nano**, `InferenceSource.IN_CLOUD` to **Cloud Gemini**, and anything else to **Unknown inference source**.
- Uses a reviewed, bundled strategy if Firebase is unavailable, the model fails, or the SDK returns no usable text. The fallback is labelled **Curated offline library** and states that no model was used.

The UI also checks for `window.LanguageModel` to report browser capability. That check is informational only; it does not label a response as on-device.

### Verified evidence

On the hosted preview, Chrome exposed a built-in AI object, but the Firebase AI Logic SDK reported:

- Source: `Cloud Gemini`
- Detail: `The SDK reported cloud inference.`
- Prompt: de-identified Primary 4 "Sources and uses of water" strategy.
- Evidence screenshot: `artifacts/web/tiny-web-ai-cloud.png`.

This is a genuine cloud response. It is **not** evidence of on-device execution.

### On-device requirements and verification

On-device browser inference requires all of the following, subject to current Chrome and Firebase AI Logic documentation:

- A supported desktop Chrome version with the built-in Prompt API / Gemini Nano model available.
- Compatible hardware and enough free disk space for the model.
- The model downloaded and available to the browser.
- A secure context (HTTPS or localhost).
- A supported Firebase AI Logic web SDK version and App Check configuration.

To verify physical on-device execution:

1. Use a machine that meets the current Chrome built-in AI requirements.
2. Confirm the model is available in Chrome and that `window.LanguageModel` is present.
3. Open the hosted `/ai` page and generate a strategy.
4. Read the source pill. Claim on-device only if it displays **On-device Gemini Nano** and the detail says the SDK reported on-device inference.
5. Record the Chrome version, operating system, hardware, model state, screenshot and exact response metadata.
6. If the SDK reports **Cloud Gemini**, record cloud fallback and do not claim on-device inference.

The available environment (Samsung Galaxy Note 10+, Android 12) is not a supported Gemini Nano device, and the browser SDK reported cloud. On-device inference remains unverified and is not claimed.

## 9. Security and privacy

- Synthetic data only. No real pupil names, guardian numbers, school registers or message bodies.
- Firebase Web API key and app ID are public client configuration, not server secrets.
- The web uses a dedicated, registered App Check debug token for the preview. It is embedded in the hosted client because AI Logic requires App Check and judges need a working preview. It is revocable and must be revoked after judging.
- The token is supplied from an ignored local environment file or the GitHub secret `FIREBASE_WEB_APP_CHECK_DEBUG_TOKEN`; it is never committed.
- App Check enforcement remains off. This is a preview limitation, not a production security claim.
- Firestore rules remain in force. The browser does not write authoritative collections and does not use a service account.
- React renders message and teacher text as text; there is no `dangerouslySetInnerHTML` path.
- The preview does not log phone numbers, OTPs, message bodies or pupil names to a production logging service. Browser console output is limited to SDK diagnostics.
- Browser IndexedDB/localStorage is unencrypted. This is acceptable only because the preview is synthetic and must not be used for real children's data.
- The guardian simulator is not an authentication boundary. It is a local demonstration of SMS-style messaging.

## 10. Responsive design and accessibility

- Desktop: fixed sidebar, topbar connectivity/sync status, language selector, help/settings shortcuts and two-column work areas.
- Tablet: single-column work areas below 1120 px; sidebar remains until 820 px.
- Mobile: bottom navigation, stacked cards, full-width forms, touch-sized controls and wrapping class rows.
- `prefers-reduced-motion`-equivalent setting via the in-app **Reduce motion** toggle and system media query.
- **Large text** increases the base font size.
- Focus-visible outlines, labelled form fields, ARIA groups for attendance toggles, status roles, accessible empty states, focus-trapped tours and a skip link.
- Language selector updates the whole interface immediately and persists across reloads. All four teacher languages are captured at every viewport.
- Playwright axe scan on the home page: **0 serious or critical WCAG 2 A/AA violations**.
- Screenshots: 60 localized captures in `artifacts/web/i18n/` plus the representative responsive set in `artifacts/web/`. See `docs/SCREENSHOTS.md`.

## 11. Local development

Requirements: Node.js 22 and npm. The repository pins the web dependency tree in `web/package-lock.json`.

```powershell
cd web
npm ci
Copy-Item .env.example .env.local   # then fill placeholders
npm run dev
```

The dev server prints a local URL (normally `http://localhost:5173`). Web tests and the Playwright configuration use port `4173` for the production preview.

### Environment variables

`web/.env.example` documents the names with placeholders. Never commit `web/.env.local`.

| Variable | Public? | Purpose |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Public client config | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Public | Auth domain, normally `tiny-b9f29.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Public | `tiny-b9f29` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Public | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Public | Sender ID |
| `VITE_FIREBASE_APP_ID` | Public | Registered web app ID |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | Revocable secret | Dedicated web preview App Check token |
| `VITE_RECAPTCHA_SITE_KEY` | Public | Optional real reCAPTCHA Enterprise site key |
| `VITE_DEMO_EMAIL` | Synthetic | Prefilled preview email |
| `VITE_DEMO_PASSWORD` | Synthetic | Prefilled preview password |
| `VITE_FUNCTIONS_EMULATOR` | Public | `true` only for local Functions-emulator sync |

### Scripts

```powershell
npm run typecheck
npm test
npm run build
npm run preview
npx playwright test
$env:TINY_LIVE_FIREBASE='1'; npx playwright test e2e/firebase-live.spec.ts --project=desktop-chromium
```

## 12. Firebase setup used by the preview

Existing project: `tiny-b9f29` (Spark, billing disabled). No new Firebase project was created.

- Web app: `Tiny web`, app ID `1:1072757481941:web:10a300a3c9756e1520dd5c`.
- Email/Password provider enabled for the synthetic preview account.
- Firestore workspace `ws_webdemo0001` with two classes, eight pupils, four guardians, pupil-guardian links, lessons, progress, attendance and conversations.
- The web user is an active member of the workspace. Firestore rules remain authoritative.
- A dedicated web App Check debug token was registered for the preview and supplied only through the ignored local env/build secret.
- The existing Firestore rules and indexes were not weakened or replaced.

No Cloud Functions were deployed. No billing, Blaze, live SMS, App Distribution invitation or production data was added.

## 13. Tests and evidence

### Automated

| Suite | Result |
|---|---|
| TypeScript | `npm run typecheck` passed |
| Translation guard | 754 keys × 4 languages; 0 hardcoded UI strings |
| Vitest unit/component | 23 passed, 0 failed (6 files) |
| Production build | passed; PWA precache 7 entries |
| Playwright desktop | 12 passed, 1 skipped |
| Playwright tablet | 12 passed, 1 skipped |
| Playwright mobile | 12 passed, 1 skipped |
| Live Firebase/AI check | 1 passed with `TINY_LIVE_FIREBASE=1` |
| Axe serious/critical violations | 0 |
| Android/backend regression | passed in CI run [45999218913](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218913) |

The Playwright suite covers:

- Teacher class creation, refresh recovery, attendance submission and progress approval.
- Teacher and guardian simulator message exchange.
- Offline banner, local draft persistence and offline reload after service-worker activation.
- Teacher tour skip/persist/replay, guardian guide completion, language switching and reload persistence.
- All four languages at desktop/tablet/mobile with no horizontal overflow and 60 screenshots.
- Home accessibility scan.
- Desktop/tablet/mobile responsive screenshots and navigation.

The live test is skipped by default so ordinary CI does not consume Firebase AI quota or require App Check secrets. Run it manually with `TINY_LIVE_FIREBASE=1`.

### CI

Workflow: `.github/workflows/web-ci.yml`.

It runs on pushes/PRs touching `web/**`, `shared/**`, `tools/**` or `firebase.json`:

1. `npm ci`
2. translation generator check + hardcoded-string guard
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. Playwright Chromium install
7. `npx playwright test`
8. Upload screenshots and Playwright report

The workflow does not require Firebase credentials because the default browser journeys use the synthetic offline demo. The live Firebase check is intentionally manual.

Latest green runs:

- Web CI: [45999218456](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218456).
- Android/backend regression on the same commit: [45999218913](https://github.com/onyebuchidaniel60/tiny/actions/runs/45999218913).

The first web run (`45973072502`) surfaced two timing issues: an immediate navigation could outrun the IndexedDB write, and headless mobile Chromium could not hit the fixed bottom-nav link reliably. The app now persists state at action time and prefers the synchronous localStorage recovery copy; functional tests open routes directly while the responsive test asserts the mobile nav and href. The rerun is green.

### Manual evidence

- Hosted sign-in and Firestore bootstrap: verified on 27 November 2026.
- Hosted AI request: `Cloud Gemini`, detail `The SDK reported cloud inference.`
- Hosted screenshot: `artifacts/web/tiny-web-ai-cloud.png`.
- Latest deployed assets after the final redeploy: `assets/index-*.js` and `assets/index-*.css` (hashed file names change on rebuild; verify from the Hosting release).
- Build output: approximately 1.17 MB JavaScript (351 kB gzip) and 36 kB CSS (7.4 kB gzip), including Firebase SDK and the four-language catalogue. The bundle is a preview, not yet route-split.

## 14. Deployment and rollback

The preview is hosted on Firebase Hosting in the existing project. This is zero-cost under Spark and uses the existing authorized Auth domain.

```powershell
cd web
npm ci
npm run build
cd ..
firebase deploy --only hosting --project tiny-b9f29
```

`firebase.json` serves `web/dist`, rewrites all routes to `index.html`, sets `no-cache` for `index.html` and `sw.js`, and long-lived immutable caching for `/assets/**`.

Rollback: redeploy the previous `web/dist` build or revert the hosting release in the Firebase console. Do not delete Firestore data or the Firebase project.

Vercel was evaluated but the available CLI session was not authenticated. Firebase Hosting was already configured, free and authorized, so it is the deployed zero-cost preview. No Vercel deployment is claimed.

## 15. Known limitations and operator actions

Limitations:

- Local-only writes; no hosted callable sync and no cross-device synchronization.
- No real SMS, parent account, parent login or live guardian channel.
- No on-device AI proof; only cloud fallback is verified.
- App Check enforcement is off; Play Integrity and release fingerprints are not configured.
- Browser storage is not encrypted and must remain synthetic-only.
- Email/password is a preview auth path; Android remains phone-first.
- PWA cache updates can briefly serve an older shell.
- The AI prompt is intentionally narrow (English, Primary 4 basic science) and is not a general chatbot or grading system.

Operator-only actions:

- Keep the hosted preview and the web App Check debug token available through judging (ends 16 December 2026).
- Revoke the web debug token after judging and rebuild/redeploy without it.
- Confirm eligibility, team/IP, Devpost entry and public YouTube upload.
- Do not enable Blaze, billing, live SMS or production data.
- If a supported Gemini Nano device becomes available, run the on-device verification in section 8 and update the evidence.

## 16. Manual test guide

1. Open <https://tiny-b9f29.web.app>. Sign in with the synthetic account or choose **Continue in offline demo**.
2. Confirm the workspace shows **Kofar Primary** (the display name for the synthetic Firestore workspace), two classes and eight pupils.
3. Open **Classes**, create a class, reload, and confirm it remains.
4. Open **P4 Blue**, add a synthetic pupil, then open **Register**.
5. Mark every pupil, submit, reload and confirm the submitted state and local queue.
6. Open **Lessons**, edit a plan, save, reload and confirm the text persists.
7. Open **Progress** for a pupil, write a factual observation, save a draft and approve it locally.
8. Open **Messages**, queue a reply, then open **Open guardian view**.
9. Send a synthetic guardian message, return to the teacher inbox and confirm it appears.
10. In **Guardians**, add a synthetic endpoint and link it to a pupil.
11. Open DevTools, set the network to **Offline**, confirm the offline banner, edit a draft, reload, and confirm the draft survives. Return online.
12. Open **Teaching helper**, generate a strategy and read the source pill. Confirm `Cloud Gemini` unless a supported on-device environment explicitly reports otherwise.
13. Use **Show offline strategy** and confirm it is labelled **Curated offline library**, not a model result.
14. Open **Settings**, toggle large text and reduced motion, then reset local demo data if desired.
15. Resize to a phone width (about 390 px) and confirm the bottom navigation and topbar Settings shortcut work.

## 17. Evidence index

| Artifact | Meaning |
|---|---|
| `artifacts/web/tiny-web-ai-cloud.png` | Hosted AI result with SDK-reported `Cloud Gemini` |
| `artifacts/web/desktop-chromium-home.png` | Desktop home |
| `artifacts/web/desktop-chromium-class.png` | Desktop class detail |
| `artifacts/web/mobile-chromium-home.png` | Mobile home |
| `artifacts/web/mobile-chromium-class.png` | Mobile class detail |
| `web/playwright-report/` | Local Playwright report (ignored by Git) |
| `.github/workflows/web-ci.yml` | CI definition and evidence upload |

The preview is a synthetic evaluation surface. It is useful, responsive and honest about what is local, what is cloud and what remains unverified.
