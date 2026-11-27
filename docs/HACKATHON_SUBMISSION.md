# Hackathon Submission Review — #BuildHybridAI 2026

Official rules: <https://firebasehybridaihackathon.devpost.com/rules> (accessed 27 November 2026).
**Submission status:** NOT SUBMITTED. Devpost entry and public YouTube upload are still operator actions.
Contest period ends **30 November 2026, 2:00 P.M. Pacific / 22:00 UTC**. Judging ends 16 December 2026.

## 1. Eligibility and authority

| Requirement | Status | Action / risk |
|---|---|---|
| Entrant above age of majority | **Operator must confirm** | Eligibility risk if not confirmed |
| Not resident in an excluded country | **Operator must confirm** | Nigeria is not listed as excluded; confirm individual residence |
| Not a Google/Devpost employee, contractor, judge or household member | **Operator must confirm** | Conflict-of-interest risk |
| Entrant owns the submission/IP | **Operator must confirm** | Third-party reference assets are reference-only; code is original |
| Devpost account and registration | **PENDING** | Operator must create/confirm the Devpost account |
| Team or individual | **Operator must specify** | Add all team members on Devpost if a team |

## 2. Required submission elements

| Requirement | Current status | Evidence / action |
|---|---|---|
| Gen AI app using Firebase AI Logic | **IMPLEMENTED** | `AiLogicService` uses Firebase AI Logic at runtime |
| Android + Gemini Nano 4 via AI Logic | **PARTIAL — on-device hardware not verified** | `InferenceMode.PREFER_ON_DEVICE` configured; cloud fallback verified; supported-device test absent |
| Supported Firebase products | **YES** | Auth, Firestore, App Check, AI Logic |
| App Check with debug token accepted | **YES** | Dedicated judge debug token; private CI token separate |
| Installable, working test build | **PREPARED AND PUBLISHED** | Public prerelease `v0.1.0-preview.1`: `tiny-judge-preview.apk`; installation in `docs/JUDGE_ACCESS.md` |
| Test access free and unrestricted until judging ends | **YES, if release stays up** | Keep the release and judge token until 16 December 2026 |
| Public code repository | **YES** | `https://github.com/onyebuchidaniel60/tiny` |
| Open-source license visible at top | **YES** | Apache-2.0 `LICENSE`; GitHub About detects `Apache License 2.0` |
| AI Logic imported and called in code | **YES** | `app/src/main/java/ng/tiny/education/core/ai/AiLogicService.kt` |
| Demo video ≤3 minutes, public YouTube link | **LOCAL RENDER READY — NOT UPLOADED** | 146.6s MP4 with captions; operator must upload to YouTube as public and provide the URL |
| English language / English captions | **YES** | Narration and captions are English |
| Text description of AI Logic use, features and value | **DRAFTED** | Use this file and README; finalize on Devpost |
| Testing instructions | **READY** | `docs/JUDGE_ACCESS.md` |
| Summary of what was built during the submission period | **NEEDS FINAL DISCLOSURE** | Implementation was built during the contest period; product handoff/template documents pre-existed. Disclose clearly |
| No production keys, live secrets or PII in repo/submission | **YES** | Public client config only; judge token is intentionally in the public test APK; no private CI token or real data |
| Third-party tools/assets authorized | **YES, subject to operator confirmation** | Reference images are reference-only; dependencies use their licenses |

## 3. Explicit disqualification and scoring risks

1. **On-device hybrid proof is incomplete.** The code requests `PREFER_ON_DEVICE`, and the cloud fallback is verified. However, no supported physical Nano device is available, so the submission cannot yet show on-device inference actually executing. Judges may treat this as failing the hybrid requirement, or may score it lower. Mitigation: disclose honestly, provide the `docs/AI_HYBRID_VERIFICATION.md` procedure, and run it if a supported device becomes available before submission. Do not fabricate on-device evidence.
2. **YouTube demo missing.** The rules require a public YouTube link. A local MP4 is not enough. This is a hard submission risk until the operator uploads it.
3. **License detection — fixed.** `LICENSE` is present and GitHub reports `Apache License 2.0` in the repository metadata. Keep it visible at the top of the repo.
4. **Deadline.** Submission closes 30 November 2026 at 22:00 UTC. Devpost entry, YouTube upload and final testing instructions must be completed before then.
5. **Testing availability.** The public judge APK is a debug-signed preview with a dedicated App Check token. Keep it available through the judging period; revoking the token or deleting the release early would break judge testing.
6. **Functions not deployed.** Cloud Functions are emulator-only under Spark/NGN 0. Judges may see sync retry/error states. The APK still demonstrates local workflows, Auth, Firestore and AI cloud fallback. Disclose this in the testing notes.
7. **Debug token in a public APK.** The rules accept debug tokens, but the token is a secret by nature. Use the dedicated judge token only; revoke it after judging. Do not embed the private CI token.
8. **Existing-project disclosure.** The app implementation is new work from the contest period, but the repository contains pre-existing product/architecture handoff documents and templates. Provide the required summary of what was built during the submission period; do not claim pre-existing work as newly built.
9. **Eligibility/conflict checks.** The operator must confirm age, residence, employment/conflict status and team membership. These are pass/fail Stage One risks.
10. **No production/paid dependencies.** The project uses free tiers and synthetic data. Disclosure of paid services is not needed because none are used.

## 4. Suggested Devpost fields

- **Project name:** Tiny
- **Tagline:** Big impact. Small requirements. Accessible everywhere.
- **Platform:** Android
- **Repository:** `https://github.com/onyebuchidaniel60/tiny`
- **Demo video:** YouTube URL (operator upload required)
- **Testing link:** `https://github.com/onyebuchidaniel60/tiny/releases/tag/v0.1.0-preview.1`
- **Test credentials:** phone `08000000001`, code `123456` (synthetic Firebase test account)
- **Built with:** Kotlin, Jetpack Compose, Firebase Auth, Firestore, App Check, Firebase AI Logic, Gemini Developer API, Android SDK, Room/SQLCipher, WorkManager
- **Description:** offline-first teacher tool for rural Nigerian primary schools; parents use SMS; pupils have no accounts; hybrid AI assists lesson planning without gating core work.
- **AI Logic use:** de-identified Primary 4 science prompt, `PREFER_ON_DEVICE`, cloud fallback, SDK-reported source, curated offline fallback; no PII, no autonomous parent-facing content.

## 5. Final operator actions before submission

1. Confirm eligibility, age, residence, team and IP ownership.
2. Upload the demo MP4 to YouTube as a public video with English captions; use `artifacts/demo/youtube-description.md`, add the link to Devpost and README.
3. Publish or confirm the judge APK release and keep it available through 16 December 2026.
4. Add judge emails to the `judges` App Distribution group if using that option (optional).
5. Complete the Devpost submission form and submit before 30 November 2026, 22:00 UTC.
6. If a supported Nano device is available, run the on-device acceptance procedure and update the evidence before submitting.
