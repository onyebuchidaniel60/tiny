# Tiny — Demo Video Plan

**Status:** Planned; video cannot be produced until the real application is implemented and verified.  
**Target duration:** 90–150 seconds.  
**Hard maximum:** 180 seconds.  
**Audience:** Firebase #BuildHybridAI judges and product evaluators.  
**Product pronunciation:** Tiny = TIE-nee.

## Story

Show that Tiny gives rural teachers practical tools on the Android phone they already have, even when connectivity is unavailable, and gives parents a simple SMS route into the school.

## Required narrative order (suggested 135 seconds)

| Time | Visible action | Narration point |
|---|---|---|
| 0–8s | Tiny launch, teacher home, offline badge | Tiny is designed for teachers' existing Android phones and limited infrastructure. |
| 8–25s | Open downloaded Primary 5 lesson, show 5E structure | Lesson resources remain available without internet. |
| 25–45s | Enable airplane mode, mark register and submit | Attendance is captured locally; no absence message is sent before server acceptance. |
| 45–58s | Restore network, show sync complete and sandbox job status | When signal returns, the queued attendance synchronizes and absence-only notifications are processed. |
| 58–75s | Sandbox parent sends inbound SMS; teacher inbox displays it; teacher replies | Parents can initiate communication using basic phones, and teachers reply without exposing personal numbers. |
| 75–92s | Record a subject progress observation, approve it, show digest preview | Parents receive more than attendance: approved learning progress, positive feedback and practical support. |
| 92–112s | Show verified hybrid AI source evidence: on-device then cloud | Tiny uses on-device inference where the handset supports it and cloud inference for appropriate connected tasks. |
| 112–135s | Return to teacher dashboard and concise end card | Big impact. Small requirements. Accessible everywhere. |

Adjust timings to the actual product; never narrate a feature that is not visible and working in the capture.

## Capture procedure

1. Use deterministic synthetic data only (e.g. sample school `Kofar Demo Primary`, fictional teacher and pupils, invalid/test phone numbers).
2. Reset the demo database to a documented snapshot before recording.
3. Use a physical Android device for native app capture; use `adb screenrecord`, UIAutomator, Maestro or equivalent. Playwright may be used for a browser-based operator console only if one exists; MVP has no web app.
4. Record real UI behavior. Include airplane-mode transition and a real app restart before sync if the product flow permits reliable capture.
5. Use the eSMS sandbox or deterministic sandbox simulation; label simulated/provider sandbox messages honestly. Never use real parent numbers.
6. Capture on-device inference on a supported physical Android handset and record SDK inference source evidence; capture cloud inference separately. Do not fabricate a source label.
7. Capture clean footage without account identifiers, secrets, tokens, private URLs or real PII.

## Narration and editing

- Write narration only after the capture sequence is stable.
- At Phase 8, verify Google AI TTS availability, free quota, terms, credentials and billing requirements as they exist then.
- Do not assume unlimited free use or incur charges. If Google option is unavailable or unsuitable, use a genuinely free permitted TTS fallback and record the substitution.
- Synchronize narration to visible action; use natural pacing and avoid long silent gaps, rushed lines or mismatched narration.
- Add concise captions where feasible; keep captions readable on mobile.
- Balance voice and UI/system audio; remove accidental notification sounds or private information.
- Add subtle transitions, no unnecessary intro animation, and a legible final identity line.

## Outputs

Default directory: `artifacts/demo/`.

- `tiny-demo.mp4`
- `narration-script.md`
- `production-notes.md`
- `captions.srt` (where feasible)
- Capture source clips/project file if practical and license-compatible.

## Final review checklist

- [ ] Video duration <=180 seconds (target 90–150).
- [ ] Full rendered file plays from beginning to end.
- [ ] Audio is present, intelligible and synchronized.
- [ ] No clipped narration or awkward long silences.
- [ ] Every narrated function is visible and verified.
- [ ] Hybrid source evidence is genuine (on-device and cloud).
- [ ] Sandbox/simulation is clearly represented accurately.
- [ ] No real child/guardian data, phone number, secret, token or private URL is exposed.
- [ ] Captions reviewed if included.
- [ ] Video, script and production notes are saved and linked in `AI_HANDOFF.md`.
