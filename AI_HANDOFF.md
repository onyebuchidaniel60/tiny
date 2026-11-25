# Tiny — AI Implementation Handoff

**Last updated:** 25 November 2026  
**Current status:** Planning/handoff package complete; application implementation has not started.  
**Current phase:** Phase 0 — consolidated operator intake/readiness.  
**Next task:** Read all handoff documents, inspect target repository without modifications, and complete `OPERATOR_INTAKE.md` in one consolidated pass.

## Product/architecture baseline

- Tiny (TIE-nee); “Big impact. Small requirements. Accessible everywhere.”
- Native Android teacher app; Kotlin + Jetpack Compose.
- Personal Android phones are the target teacher device.
- Parents use basic phones through two-way SMS. No parent app or login.
- No student interface or student accounts.
- School-managed or independent teacher-created workspaces; independent teachers have full core functionality.
- Multiple classes/subjects per teacher; multiple guardians per pupil; one guardian may be linked to multiple pupils.
- NERDC Revised Basic Education Curriculum Primary 1–6; 5E lesson framework.
- Teacher UI languages: `en`, `ha`, `yo`, `ig`; parent SMS languages: `en`, `ha`, `yo`, `ig`, `pcm`.
- Immediate attendance notification for absences only; weekly digest Friday 15:00 Africa/Lagos.
- Two-way SMS / parent-initiated messages / teacher inbox / teacher reply.
- Progress indicators and teacher-authored observations; teacher approval before sharing.
- Hybrid AI via Firebase AI Logic: English on-device where compatible; cloud for complex/non-English tasks; no PII in prompts; offline curated fallback.

## Fixed implementation architecture

- Android: Kotlin, Jetpack Compose, MVVM/repository/use-case separation, Coroutines/Flow.
- Local data: Room + SQLCipher, key protected by Android Keystore; Room is local source of truth.
- Sync: WorkManager, durable outbox, UUID idempotency, bounded batches, server acknowledgements/conflicts.
- Cloud: Firestore Standard + Cloud Functions Gen2 TypeScript/Node 22, co-located `africa-south1`.
- Auth: Firebase Phone Auth for teachers/admins; first auth requires internet.
- Integrity: Firebase App Check + Play Integrity.
- AI: Firebase AI Logic/Gemini Developer API globally processed cloud route; optional experimental on-device SDK on supported devices.
- SMS: eSMS Africa Two-Way SMS; sandbox only until production authority and budget exist.
- Preview: protected Firebase App Distribution or approved secure APK artifact, not a website.
- No payment system, voice calling, web frontend, parent app or student app.

## Current readiness

| Item | Status | Notes |
|---|---|---|
| Product scope and roles | CONFIRMED | `PROJECT_SPEC.md` |
| Business rules | CONFIRMED | `TINY_PROJECT_BLUEPRINT.md`, `docs/API.md`, `docs/DATA_MODEL.md` |
| Architecture | CONFIRMED | `ARCHITECTURE.md` |
| Implementation phase plan | CONFIRMED | `IMPLEMENTATION_PLAN.md` |
| Coding-agent rules | READY | `AGENTS.md` |
| Operator intake | PENDING | Complete before code changes |
| UI reference image(s) | BLOCKED | None supplied; required before final UI phase; ask in consolidated intake |
| Repository URL/access | PENDING | Inspect if already mounted/connected; otherwise ask once |
| Firebase project/IAM/billing | PENDING | No project access supplied |
| Supported physical Android test device | BLOCKED | Required to prove real on-device inference |
| eSMS sandbox credentials | PENDING | No real SMS without separate authorization |
| Production SMS authority/budget | NOT AUTHORIZED | Default zero budget/no live sends |
| Production deploy authority | NOT AUTHORIZED | Staging/preview only unless explicitly granted later |
| Demo voice/TTS | PENDING | Recheck free tier/terms at Phase 8 |


## Handoff package validation

- [x] 26 Markdown documents are present in the handoff package (including `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`).
- [x] The uploaded `PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS(5).md` is preserved byte-for-byte at `docs/PROPER_VIBE_CODING_WORKFLOW.md` (SHA-256 `11607c448d9803ef27ab69d7e20d53730c2f535fc8b2b97559c9f464b66cacdb`).
- [x] Internal Markdown links resolve within the package.
- [x] Markdown fenced code blocks are balanced.
- [x] Package contains documentation only; no application source code, migrations or executable implementation.
- [x] ZIP archive passed integrity validation.

## Preview / deployment evidence

- Preview URL: **Not created**.
- Distribution channel: Pending intake; default Firebase App Distribution.
- Deployed commit: **None — implementation has not started**.
- Production deployment: **Not authorized**.

## Skill status

- Required UI skill command: `npx skills add benjitaylor/skills --skill stageshow`.
- Installation/inspection: **Not attempted; must occur at the start of UI work (Phase 6)**.
- Additional UI skills: optional, evaluate for relevance and trustworthiness.
- Firebase Agent Skills: required baseline selected; install/inspect in Phase 1 as documented. Firebase MCP: recommended, disabled pending project access and authorization.

## Firebase Agent Skills and MCP status

- Requirement added: use official Firebase Agent Skills as progressive Firebase-specific implementation guidance in OpenCode.
- Selected baseline IDs: `firebase-basics`, `firebase-local-env-setup`, `firebase-auth-basics`, `firebase-firestore-standard`, `firestore-security-rules-auditor`.
- Install phase: Phase 1, project-local copied files; inspect selected skill files/scripts, verify fresh-session discovery, preserve lockfile if generated.
- Optional `firebase-crashlytics` skill requires a product/privacy decision before installation/use.
- `firebase-ai-logic-basics` is listed by Firebase as web-app focused; it is not authoritative for the native Android Hybrid AI implementation. Use current Android-specific docs instead.
- Firebase MCP: recommended companion, not yet configured/connected. Keep disabled until operator authorizes non-production project access and bounded tool permissions. State-changing operations require explicit approval.
- Detailed policy: `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.
- Skill source commit, installed paths, OpenCode discovery check, MCP status and operation scope: **pending implementation Phase 1 / authorized Firebase access**.

## Documentation status

- [x] Product spec
- [x] Architecture
- [x] Implementation plan
- [x] Agent instructions
- [x] Operator intake template
- [x] Reference asset register
- [x] API design
- [x] Data model
- [x] Security design
- [x] Setup/configuration/testing/deployment/operations/troubleshooting guides
- [ ] Implementation README updated with actual build commands/results
- [ ] Design notes completed against actual reference images
- [ ] Build log populated with implementation evidence

## Demo status

- Video: Not produced; requires completed real application.
- Target length: 90–150 seconds; absolute maximum 180 seconds.
- Demo data: synthetic only.
- Demo journeys: offline lesson, offline attendance and sync, sandbox absence SMS, parent inbound message/teacher reply, approved progress/digest, verified on-device/cloud AI source.
- Voice/TTS: verify current free Google AI option/quota/terms at production time; use permitted free fallback if unavailable; no charges without authority.

## Authorization boundaries

- Do not reveal or commit secrets.
- Do not incur unapproved charges.
- Do not send live SMS to real parents without explicit, written production authorization, budget ceiling and approved recipients/consent.
- Do not process real pupil/guardian data in a demo.
- Do not deploy production, migrate/destructively alter production data, or enable irreversible actions without explicit authority.
- A Firebase API key or provider credential is not unlimited spending or sending authority.
- A staging deployment authorization does not imply production release authorization.

## Known limitations / risks

1. Firebase Android on-device hybrid inference is experimental/beta and only works on selected devices; a physical compatible handset is required for proof.
2. Current official Google guidance validates on-device generation in English and Korean; Tiny uses English on-device only. Multilingual generation routes to cloud when connected or static reviewed resources offline.
3. `minSdk 26` is an explicit architecture compromise; collect real pilot device OS distribution before rollout. Connected production operations also require a Play Integrity-compatible Google Play environment; non-GMS/non-attestable phones are not fully supported online under the MVP security design.
4. Firestore `africa-south1` is Johannesburg, not Nigeria; cross-border processing review/DPIA required.
5. Gemini Developer API cloud processing is global; do not send PII.
6. eSMS Africa production activation may require KYC, shared keyword provisioning and recurring costs; sandbox only until validated/authorized.
7. Parent number can map to multiple schools/pupils; require school/pupil routing hints, never guess.
8. Curriculum seed scope and usage rights must be checked against the exact current NERDC source files.

## Checkpoint template

At each phase checkpoint update this file and `docs/BUILD_LOG.md`:

```text
Current phase:
Completed:
Tests and evidence:
Preview URL:
Deployed commit:
Reference image status:
StageShow / additional skill status:
Firebase Agent Skills / MCP status:
Documentation status:
Demo video status:
Known issues:
Authorization boundaries:
Next task:
Blocked by:
```

## Resume instruction

If context/session ends, inspect Git status, this file, `docs/BUILD_LOG.md`, and the latest commits. Resume from the next unfinished verified task. Do not redo completed work unnecessarily and do not ask for routine phase approval.
