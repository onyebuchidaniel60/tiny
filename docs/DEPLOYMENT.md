# Tiny — Deployment and Release Procedure

**Current status:** Phase 1 local debug APK built and tested. GitHub Actions workflow exists; no App Distribution upload, GitHub Pages publication or hosted backend deployment is verified yet.

## 1. Environments

| Environment | Purpose | Data | Provider mode | Authority |
|---|---|---|---|---|
| Local | Development/unit tests | Synthetic | Emulator/mock | Local developer |
| CI | Repeatable builds/tests | Synthetic | Mock/emulator | CI identity |
| Staging | Integration/E2E/protected preview | Synthetic only | Mock SMS/Emulator Suite | Operator grants preview access |
| Production | Real schools/guardians | Live, minimized | Production only after approval | Not authorized by default |

Never use production pupil or guardian data in staging/demo.

## 2. Early native preview

There is no web frontend in MVP. Early preview is a navigable native Android shell distributed as a protected APK:

1. Build debug/staging APK from route-complete shell.
2. Install and verify on test handset.
3. Upload to restricted Firebase App Distribution testers or approved private artifact destination.
4. Record exact distribution/artifact URL, version/build number, commit SHA and Firebase project ID in `AI_HANDOFF.md`.
5. Label unfinished routes and disable unsafe actions; do not imply placeholders work.
6. Update protected artifact after verified checkpoints.

Preview must not connect to production Firestore, live SMS, production AI budgets or real parent numbers.

**Preferred preview route:** Firebase App Distribution. Create `internal-testers` and `judges` groups, add approved emails in the Firebase console, and use the protected `distribution` GitHub environment for manual judge-facing uploads. Never publish a public APK link. Exact setup and permissions are in `CI_ANDROID_BUILD.md`.

## 3. Firebase staging deployment

**Current constraint:** The project is on Spark/NGN 0. Do not deploy Cloud Functions, activate Blaze or create paid hosting. Functions remain emulator-only until the operator explicitly authorizes a bounded billing change. This section is the future hosted-staging procedure, not current authorization.

- Use a separate staging project where possible.
- Deploy Firestore rules and indexes before enabling data operations.
- Deploy Cloud Functions Gen2 in `africa-south1` only after explicit Blaze/budget authorization and a completed security review.
- Keep `SMS_MODE=mock` and the empty recipient allowlist. Do not use eSMS sandbox/production without separate authorization.
- App Check debug provider only in local emulator; configure proper staging/production attestation.
- Enable only required APIs/services.
- Configure quotas and cost alerts; understand alerts are not hard billing caps.
- Verify callable auth/App Check and webhook HMAC before connecting provider.

## 4. CI pipeline

**Primary build path:** GitHub Actions Ubuntu runners. Do not install the full Android Studio toolchain on the Windows operator machine. Exact workflow, permissions, signing and App Distribution steps are in `CI_ANDROID_BUILD.md`.

On pull request/commit:
1. Checkout and set JDK/Node versions from pinned config.
2. Restore dependency caches.
3. Android format/lint/unit tests.
4. Functions lint/typecheck/unit tests/build.
5. Firestore rules tests in emulator.
6. Dependency/license/security scans.
7. Build staging APK artifact.
8. Upload only to approved protected distribution from authorized branch/workflow.

CI never prints secrets. Production deploy workflow remains disabled/protected until explicit production authority is granted.

## 5. Production release gates

Production/pilot is blocked until:
- Operator expressly authorizes the named production Firebase project and exact release operation.
- Staging E2E and security suite pass; no unresolved critical/high issue.
- DPIA, controller/processor relationship, cross-border transfer review and privacy notice are approved.
- Retention/deletion and safeguarding escalation processes are approved.
- NERDC sources, content rights and seed data are verified.
- Every production-language template is human-reviewed.
- eSMS KYC/service/keyword/short-code setup is complete, live pricing confirmed and SMS budget/daily limit authorized.
- Guardian verification, consent and opt-out flows tested.
- Physical low-end device validation complete; on-device capability disclosed as optional.
- Support/incident contacts and runbook exist.
- Backup/export and recovery process verified.
- Store/distribution privacy declarations and app-signing key custody settled.

## 6. Release steps

1. Tag candidate commit and record SHA.
2. Run clean CI and full tests.
3. Validate Firestore rules/index deployment and backup.
4. Review changes and migration safety.
5. Confirm exact production authority, SMS mode, budgets and release target.
6. Deploy backend/rules/functions using compatible sequence.
7. Release signed Android build to authorized pilot group.
8. Smoke-test using test accounts and designated test phone numbers.
9. Monitor errors, sync backlog, SMS segments, provider callbacks, AI usage and cost.
10. Record release version, commit, operator, time and rollback path.

If production authority is not supplied, stop at verified staging and provide exact release instructions. Do not infer permission from credentials or deployment access.

## 7. Rollback

- Android: stop staged rollout/distribution and provide prior approved build; migrations must be backward-compatible or have tested forward repair.
- Functions: deploy prior known-good compatible version where supported.
- Firestore: do not destructively roll back data; use append-only amendments and forward repair. Restore only with explicit recovery authority.
- SMS: disable outbound production sends through backend flag/provider service if abuse/compromise/unexpected costs arise. Preserve audit/delivery records.

## 8. Demo vs production

Hackathon demo is staging/mock, not production. Use synthetic records. Clearly label mock/simulated SMS and do not imply real parent delivery or universal on-device AI support.
