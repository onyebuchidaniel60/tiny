# Tiny — Help Centre and First-Use Tours

**Status:** 27 November 2026. Implemented in the Android app and hosted web app.

## 1. Access

- **Web:** Help in the sidebar, the question-mark icon in the top bar, or Settings → Open Help centre. Route: `/help`.
- **Android:** the help/info icon in the top app bar, or Settings → Open Help centre.
- **Tours:** Help centre → Teacher tour or Guardian guide; Settings → Replay the teacher tour / Open the guardian guide.
- **First use:** the teacher tour opens once after onboarding; Guardian guide opens once when the teacher first opens Messages. Skipping marks the tour complete so it does not block classroom work.

## 2. Help topics

| Topic | What it covers |
|---|---|
| Getting started | Language, opening the workspace, where work is saved |
| Creating and managing classes | Grade, section, academic year, multiple classes |
| Registering pupils | Display name, optional local code, sample-data rule |
| Managing guardians | Endpoint, pupil link, consent, in-person verification |
| Recording attendance | Mark every pupil, save draft, submit, absence-only alerts |
| Creating lessons | 5E objective, materials and stages, offline availability |
| Recording learning progress | Factual observation, approval, digest eligibility |
| Communicating with guardians | Family inbox, queued replies, no live SMS |
| Using the Teaching Assistant | Modes, de-identified prompt, teacher review, offline fallback |
| Working offline | Local-first storage, offline banner, what remains usable |
| Understanding sync | Outbox states, server acknowledgement, hosted limits |
| Common problems | Empty screens, sign-in, AI unavailable, resetting local data |
| Account and privacy | Synthetic-data rule, browser storage, Android encryption |

The Help screen includes search, an article count, expandable articles, the guardian SMS guide, a limitations disclosure and a contact note.

## 3. Teacher tour (10 steps)

1. Dashboard 2. Classes 3. Registering pupils 4. Attendance 5. Lessons 6. Learning progress 7. Guardian communication 8. Teaching Assistant 9. Offline work 10. Sync.

Each step uses the real feature names and limitations: absence-only alerts, teacher approval, queued replies, no Nano claim, and no hosted server write.

## 4. Guardian guide (4 steps)

The guardian experience is SMS, not an app or account. The guide explains:

1. Absence alerts after the register is accepted.
2. The Friday weekly digest with approved factual updates.
3. Two-way SMS replies reaching the teacher inbox.
4. STOP/START consent and the rule that unverified senders never receive child details.

The guide is a teacher-facing explanation of the guardian SMS journey. It does not invent a guardian app, login or dashboard.

## 5. Localization

All Help and tour content is in the shared `shared/i18n/*.json` source and is rendered in the selected language. Hausa, Yoruba and Igbo are complete drafts pending native review (see `docs/LOCALIZATION.md`).

## 6. Accessibility

- Dialog focus is trapped; Escape closes the web tour; arrow keys move between steps; focus returns to the trigger.
- Step progress is announced with `aria-live` / Compose semantics text.
- Tour controls use previous/next/skip labels, not icon-only controls.
- Help articles are keyboard-expandable cards; the search input has a visible label.
- Reduced-motion and large-text preferences are respected.

## 7. Honest limitations shown in Help

- Guardian SMS is simulated in the hosted/emulator evaluation; no live provider is connected.
- Cloud Functions are emulator-only under the zero-spend configuration; no hosted callable sync or cross-device claim.
- AI is optional; on-device Gemini Nano requires supported hardware and is not claimed on the Note 10+ or emulator.
- Sample records only; no real pupil or guardian data.
