# Tiny — User Guide

**Audience:** teachers evaluating Tiny, pilot school leads, guardians reading the SMS guide.
**Status:** 27 November 2026. This guide describes the implemented evaluation build, not a production school deployment.

## 1. What Tiny is

Tiny is a teacher workspace for primary schools. Teachers use the native Android app (or the hosted teacher companion for evaluation). Parents and guardians use ordinary SMS; there is no parent app, parent login or pupil account. Pupils never use Tiny directly.

The product is designed for an existing low-cost Android phone, intermittent connectivity and low data use. Core classroom work is local-first.

## 2. First use

1. Open Tiny.
2. Choose **English**, **Hausa**, **Yorùbá** or **Igbo**. The whole interface changes immediately and the choice is remembered.
3. Continue to the welcome screen and open the workspace.
4. The teacher tour starts once. Use **Next** and **Previous**, or **Skip tour**. It can be replayed from Help or Settings.
5. Sign in with the evaluation phone number or the evaluation web account if the build asks for authentication.

> Hausa, Yoruba and Igbo are complete draft translations awaiting native review. English is always the fallback.

## 3. Home

Home shows the greeting, date, workspace, class and pupil counts, queued work, unread family messages and the next useful actions. Start attendance with the primary button. The notice explains that only absence can trigger an immediate guardian message after server acceptance.

## 4. Classes and pupils

- **Add class:** choose P1–P6, a section label such as Blue, and the academic year.
- **Open class:** view the roster, pupil codes and guardian links.
- **Add pupil:** enter a display name; a local code is optional.
- **Progress:** open a pupil to record an observation.

Evaluation workspaces use synthetic names only. Do not enter real child or guardian data.

## 5. Attendance

1. Open a class and choose **Mark attendance**.
2. Mark every active pupil **Present**, **Absent** or **Late**. The button shows when pupils remain unmarked.
3. **Save draft** keeps partial work on this device.
4. **Submit attendance** validates the full roster and queues the register.

Only absences create an immediate notification job after the server accepts the register. Present and late do not. A queued register is not a delivery confirmation.

## 6. Lessons

Lessons uses the 5E structure: Engage, Explore, Explain, Elaborate, Evaluate. Add the objective, materials and stages. Plans are teacher-authored; they are not AI grading and not a claim of full NERDC coverage. Save the plan and it remains available offline.

## 7. Learning progress

Open a pupil, choose an indicator (Doing well, Developing, Needs support, Not assessed), write a short factual observation and an optional home activity, then save a draft. Approve the entry before it can enter a family digest. Editing an approved entry creates a new revision and resets approval.

Do not write diagnoses, labels or comparisons with other pupils. AI never grades or diagnoses a child.

## 8. Guardians and family messages

- Add a guardian endpoint, link it to a pupil and record consent.
- One guardian may serve several pupils and one pupil may have several guardians.
- Verify the guardian in person. Verification and consent are records, not a substitute for legal consent.
- The family inbox shows messages; queue a short factual reply. A queued reply is not a delivery confirmation.
- The Guardian guide explains the SMS-only family experience and STOP/START consent.

## 9. Teaching Assistant

The optional Teaching Assistant supports lesson planning, explanation, adaptation, assessment, learning support and a family-message draft. Choose a mode, generate an idea and review it. The request contains no pupil name, phone number, school record or diagnosis. If a model is unavailable, a reviewed offline idea appears. AI cannot send parent content.

On a supported physical device the SDK may report on-device Gemini Nano. On the Samsung Galaxy Note 10+ (Android 12), on-device Nano is not supported; the app does not claim it. The source label always comes from the SDK response.

## 10. Offline and sync

Classes, attendance, lessons, progress, drafts and pupil records remain usable without a network. The offline banner appears when the connection drops. The sync centre shows what is saved and queued. A synced state appears only after a real server acknowledgement. Under the zero-spend configuration, hosted Cloud Functions are not deployed; queued work stays local and the interface says so.

## 11. Settings, help and privacy

- Change language, large text and reduced motion.
- Open the Help centre and replay either tour.
- Review workspace, Firebase/Functions availability and privacy limits.
- Reset local sample data without deleting Firebase data.
- The hosted web workspace uses unencrypted browser storage and a synthetic account. The Android app uses Room + SQLCipher with a Keystore-protected key.

## 12. Guardian SMS guide

Guardians do not install Tiny. They receive and send SMS.

- An absence alert arrives after the school register is accepted.
- The Friday digest contains only approved factual learning updates and school notices.
- A guardian can reply; the teacher sees it in the family inbox.
- STOP and START control consent.
- Unverified or ambiguous senders never receive child details.

## 13. Troubleshooting

| Problem | What to try |
|---|---|
| A screen looks empty | Return to Home and reopen it; the local seed may still be loading |
| Sign-in fails | Check the evaluation number/account details; a real SMS is not available under the current arrangement |
| AI does not respond | Use the offline ideas; core classroom work is unaffected |
| Sync stays pending | Hosted Cloud Functions are unavailable under the zero-spend configuration; the work is saved locally |
| Text is too small | Use large text in Settings or the system font size |
| Need to start over | Settings → Reset local sample data (does not delete Firebase) |

## 14. What is not available

- Live parent SMS or a real SMS provider.
- Hosted Cloud Functions or cross-device server synchronization.
- Parent/pupil accounts or apps.
- A claim of on-device Gemini Nano on unsupported hardware.
- Production deployment or real pupil/guardian data.
