# Tiny — Troubleshooting Guide

This guide is updated with verified issues during implementation. Do not expose credentials or real pupil/guardian data in diagnostic output.

## 1. Android build and installation

| Symptom | Likely cause | Safe action |
|---|---|---|
| Gradle/JDK compatibility error | Installed JDK differs from pinned AGP/Gradle requirements | Read wrapper and version catalog; use documented JDK toolchain; do not upgrade several dependencies at once |
| Firebase config missing | Wrong flavor/project config | Confirm application ID and correct non-production `google-services.json`; never copy service account JSON into app |
| Install fails on device | Device API below minSdk or insufficient storage | Check `adb shell getprop ro.build.version.sdk`; current architecture sets minSdk 26; do not bypass without architecture review |
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

## 7. Escalation record

When a defect blocks a flow, capture:
- Build/version and Git commit.
- Device model, Android version and connectivity state.
- Workspace type and role (synthetic account only).
- Screen and exact action sequence.
- Error code/correlation ID and timestamps.
- Expected vs actual behavior.
- Relevant redacted logs/test evidence.
- Whether a workaround exists and whether data integrity may be affected.

Never attach database dumps, real phone numbers, names or raw messages unless there is an approved secure incident process.
