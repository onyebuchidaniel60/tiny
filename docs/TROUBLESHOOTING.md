# Tiny — Troubleshooting Guide

This guide is updated with verified issues during implementation. Do not expose credentials or real pupil/guardian data in diagnostic output.

## 1. Android build and installation

| Symptom | Likely cause | Safe action |
|---|---|---|
| Gradle/JDK compatibility error | Installed JDK differs from pinned AGP/Gradle requirements | Read wrapper and version catalog; use documented JDK toolchain; do not upgrade several dependencies at once |
| Firebase config missing | Wrong flavor/project config | Confirm application ID and correct non-production `google-services.json`; never copy service account JSON into app |
| Install fails on device | Device API below minSdk or insufficient storage | Check `adb shell getprop ro.build.version.sdk`; current architecture sets minSdk 26; do not bypass without architecture review |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` after downloading a new CI APK | Each GitHub runner generated a different debug signing key, or a Play-store/release build is installed with the same package | Compare `apksigner verify --print-certs`; uninstall the old debug package once, or configure the stable debug keystore secrets in `docs/CI_ANDROID_BUILD.md`. Never change package IDs to hide a signature mismatch |
| Install appears slow before failing | Android copies/verifies the ~31 MB APK; USB or storage throttling makes this visible | Check cable/port, free storage and USB authorization; compare SHA-256 with `artifacts/apk-summary.txt` before retrying |
| App crashes after local DB change | Schema migration or SQLCipher issue | Inspect migration test and redacted crash stack; preserve DB before repair; never destructive-reset real data |

## 2. Authentication

| Symptom | Likely cause | Safe action |
|---|---|---|
| OTP not received | Phone Auth region policy, quota, test number, carrier delay | Check Firebase Auth policy, quota and authorized test number; do not weaken rate limits |
| `quota-exceeded` | SMS abuse/quota/billing restriction | Use approved test phone and emulator; request operator review; do not retry in a loop |
| First login offline | Expected behavior | Explain first authentication requires internet; after bootstrap, local access may be available under offline policy |

## 3. Offline data and synchronization

| Symptom | Likely cause | Safe action |
|---|---|---|
| Attendance still pending | No network, worker constraint, permission or server error | Check sync state, WorkManager diagnostics and error code; do not clear outbox |
| Duplicate sync attempt | Worker retried before receipt returned | Resend same idempotency key; server receipt should return prior result |
| Attendance conflict | Another device submitted same class/date or roster changed | Refresh canonical session; present conflict to teacher; use correction flow only with reason/permission |
| Record lost after app restart | Domain/outbox not written in one Room transaction | Treat as critical defect; reproduce and fix; add persistence regression test |
| Teacher revoked while offline | Device has stale membership cache | Keep local data protected; reject server sync after reconnect; clear/restrict local workspace cache after authoritative revocation; do not claim remote wipe while offline |

## 4. Firebase/Firestore

| Symptom | Likely cause | Safe action |
|---|---|---|
| Permission denied | Missing membership, class assignment, rules scope or App Check | Inspect actor UID, workspace/class membership and rules emulator; do not loosen rules globally |
| Cloud Functions require billing | Gen2 deployment requires billing plan | Stop deployment and obtain explicit billing approval; continue emulator/local work |
| Region mismatch | Firestore and function region differ | Keep both in `africa-south1`; update client endpoints consistently |
| App Check failure | Invalid provider/configuration, missing debug token, or device cannot obtain Play Integrity verdict | Use debug provider only in local dev; configure Play Integrity for staging/prod; never disable App Check. Confirm device/GMS/Play Integrity support; unsupported devices are not connected clients under this MVP baseline |

## 5. SMS and parent communication

| Symptom | Likely cause | Safe action |
|---|---|---|
| Inbound message not visible | Sandbox not activated, webhook URL wrong, signature rejected, keyword routing ambiguous | Check provider event ID, function status, HMAC result and school code; never log raw secret or full message by default |
| Signature invalid | Raw-body canonicalization or wrong secret | Compare provider docs/config with raw byte handling; rotate if secret exposure suspected; never disable signature verification |
| Parent asked for school code | Number linked to multiple workspaces/pupils | Parent must provide correct code; do not guess or reveal linked schools |
| Provider accepted but not delivered | Delivery callback delay/failure or carrier issue | Keep status `accepted`/`unknown`; inspect callback and provider portal; never label delivered without evidence |
| SMS blocked by budget guard | Budget zero/limit reached | Expected closed-by-default behavior; require operator to approve a revised cap; no auto top-up |
| Message too many segments | Unicode or long free text | Shorten with approved localized template; retain critical facts; enforce segment cap |
| Parent can't use Pidgin/locale | Template not reviewed/published | Do not auto-send machine translation; configure reviewed fallback or hold send |

## 6. AI/hybrid inference

| Symptom | Likely cause | Safe action |
|---|---|---|
| On-device AI unavailable | Unsupported handset, model not present/downloaded or SDK state | Show curated offline resource and capability explanation; do not treat as app failure |
| Model download uses data | Download not restricted/explicitly approved | Fix download flow to ask and Wi-Fi-prefer; no silent download on mobile data |
| Inference source says cloud | SDK fell back due capability/model/network | Record actual source; do not present as on-device result |
| Non-English offline AI unavailable | Current on-device language limitations | Use approved static translated content; cloud only when connected |
| AI output invalid | Schema mismatch, hallucination or unsupported locale | Reject, optionally bounded retry, then fallback; never save/send automatically |
| Cloud quota exceeded | Rate/cost limit | Show unavailable message; serve local resource; alert operator; do not silently switch to paid provider |

## 7. Browser companion

| Symptom | Likely cause | Safe action |
|---|---|---|
| Hosted page looks stale after deploy | An older PWA service worker is serving a cached shell | Reload, hard reload, or clear site data for `tiny-b9f29.web.app`; verify `/index.html` directly from the server; do not assume the deploy failed |
| `auth/unauthorized-domain` | Hosting domain missing from Firebase Auth authorized domains | Use `tiny-b9f29.web.app` or add the approved domain in Firebase Console; do not disable Auth protections |
| Sign-in fails with the documented account | Email provider disabled, wrong password or synthetic account missing | Confirm Email/Password is enabled and the synthetic account exists in `tiny-b9f29`; reset only the synthetic password |
| Firestore `permission-denied` | Web UID is not an active workspace member, or rules changed | Check `workspaces/ws_webdemo0001/members/{uid}` and the rules; never loosen rules to make the preview work |
| AI always shows `Cloud Gemini` | This browser/hardware did not provide a usable on-device model | Record cloud inference; use a supported Chrome desktop environment and follow section 8 of `WEB_APP.md`; do not relabel the source |
| AI shows curated fallback | App Check token invalid, AI quota/network failure or SDK unavailable | Check the registered web debug token, App Check enforcement state and browser console; the curated strategy is a safe fallback, not a model result |
| Queued edits never become synced | Hosted build has `VITE_FUNCTIONS_EMULATOR=false`; Functions are emulator-only | Keep the honest pending state; do not claim hosted sync; test the emulator path only locally |
| Local data disappears | Site data/cache was cleared or the browser is in a private session | Expected for browser storage; use Settings -> Reset only when intentional; no server copy exists |
| Offline reload fails | Service worker was not yet active or its cache was cleared | Load once online, wait for worker control, then test offline; use a normal (not private) window |
| Mobile navigation missing | Viewport meta missing or CSS loaded from an old worker | Confirm the viewport meta tag and clear the stale worker; check the bottom navigation and topbar Settings shortcut |
| Playwright `load` timeout | Firebase Auth's hidden iframe can delay the browser load event on a slow network | The suite waits for DOM readiness and visible UI; do not treat the delay as a rendered-app failure |

## 8. Escalation record

When a defect blocks a flow, capture:
- Build/version and Git commit (include whether the surface is Android or the browser companion).
- Device model, Android version and connectivity state.
- Workspace type and role (synthetic account only).
- Screen and exact action sequence.
- Error code/correlation ID and timestamps.
- Expected vs actual behavior.
- Relevant redacted logs/test evidence.
- Whether a workaround exists and whether data integrity may be affected.

Never attach database dumps, real phone numbers, names or raw messages unless there is an approved secure incident process.
