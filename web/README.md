# Tiny browser companion

Teacher-facing browser preview for Tiny. The native Android app remains the primary product; this surface exists for operator-requested evaluation and manual testing.

- Hosted preview: <https://tiny-b9f29.web.app>
- Synthetic account: `judge@tiny-demo.example` / `TinyDemo2026!`
- Full architecture, security, AI evidence and manual guide: [`../docs/WEB_APP.md`](../docs/WEB_APP.md)

## Scope

The app includes Home, Classes, class detail/roster, Attendance, Lessons, 5E lesson editing, Progress, Messages, a synthetic guardian SMS simulator, Guardians, Sync, Settings and the AI teaching helper.

It is synthetic-data-only. It has no parent login, pupil account, live SMS, hosted callable sync or cross-device synchronization. Firestore access is read-only bootstrap through the existing rules; teacher edits are stored locally.

## Development

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill the Firebase Web values and the dedicated App Check debug token.
npm run dev
```

`web/.env.local` is ignored by Git. The Firebase Web API key is public client configuration. The App Check debug token is revocable and must never be committed.

## Quality checks

```powershell
npm run typecheck
npm test
npm run build
npx playwright install chromium
npx playwright test
```

The default browser journeys use the offline demo. The optional live Firebase/AI check is:

```powershell
$env:TINY_LIVE_FIREBASE='1'; npx playwright test e2e/firebase-live.spec.ts --project=desktop-chromium
```

## Deployment

Firebase Hosting serves `web/dist` from the existing `tiny-b9f29` project:

```powershell
npm run build
cd ..
firebase deploy --only hosting --project tiny-b9f29
```

`firebase.json` adds the SPA rewrite and cache headers. Vercel is not used; the available CLI session was unauthenticated.

## Limitations

- Local-only writes; Cloud Functions remain emulator-only under Spark/NGN 0.
- No real SMS, parent account or parent login.
- Browser storage is unencrypted; synthetic data only.
- On-device Gemini Nano is unverified. The hosted AI result was SDK-reported `Cloud Gemini`.
- App Check enforcement is off.
- A stale PWA worker can briefly serve an older shell; hard reload or clear site data if needed.

CI: [`../.github/workflows/web-ci.yml`](../.github/workflows/web-ci.yml).
