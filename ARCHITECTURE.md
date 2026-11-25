# Tiny — System Architecture

**Version:** 1.0  
**Status:** Fixed MVP architecture

## 1. Architecture goals

1. Make essential teacher workflows work offline.
2. Keep the client small and understandable.
3. Prevent one school/teacher from accessing another workspace's records.
4. Ensure attendance, notifications and messaging are idempotent and auditable.
5. Use Firebase AI Logic hybrid inference as a real but non-blocking capability.
6. Keep production costs and third-party access behind explicit operator authorization.

## 2. Fixed architecture decisions

| Decision | Selection | Reason |
|---|---|---|
| Client | Native Kotlin Android | Android-first and first-party hybrid AI support |
| UI | Jetpack Compose + Material 3 | Native touch UI and accessibility |
| Local persistence | Room + SQLCipher | Durable encrypted local source of truth |
| Sync scheduling | WorkManager | Persistent, network-aware retries |
| Cloud database | Firestore Standard | Firebase integration, managed document store |
| Cloud backend | Cloud Functions 2nd gen (Node 22, TypeScript) | Callables, webhooks and scheduled job in one backend |
| Auth | Firebase Phone Auth | Teacher phone-first identity |
| Authorization | Firestore rules + callable validation | Rules for reads, server authority for writes |
| App attestation | Firebase App Check + Play Integrity | Protect callable/Firestore/AI access |
| AI | Firebase AI Logic + Gemini Developer API and on-device SDK | Required hybrid inference path |
| SMS | eSMS Africa Two-Way SMS | Nigeria shared keyword, signed inbound webhooks and sandbox |
| Region | Firestore + Functions `africa-south1` | Closest supported African region and resource co-location |
| Client/cloud writes | Callable commands only | Central business validation, idempotency and atomic side effects |

### Android compatibility boundary

- Minimum supported OS for this MVP: Android API 26 (Android 8.0). This is a deliberate trade-off to integrate the currently documented Firebase/ML Kit on-device generation path. The base app's offline functions work on API 26+ devices even when Gemini Nano is unsupported.
- Production-connected operations use Firebase App Check with Play Integrity. A fully connected production client therefore needs a device and Google Play environment that can obtain valid Play Integrity attestation. A non-GMS or non-attestable device may still use already provisioned local/offline content but is not a fully supported connected client under this MVP architecture. Do not weaken App Check as a workaround.
- Phase 0 must inventory the actual low-cost phones used by pilot schools, including Android version, Google Play services and Play Integrity availability. If target phones fail this baseline at meaningful rates, pause before pilot and bring an explicit architecture decision back to the operator; do not let the agent silently broaden the support claim.

## 3. Trust boundaries

- Android device is untrusted. Do not trust `workspaceId`, role, class assignment, pupil ID, phone number, status or timestamps without server validation.
- Firebase Auth establishes identity, not authorization to a workspace.
- App Check reduces unauthorized app-client traffic, but does not replace authorization.
- Firestore security rules govern reads; Cloud Functions validate writes and use Admin SDK.
- Provider webhooks are untrusted until HMAC signature and replay checks pass.
- AI output is untrusted text; schema and content validation plus human review are mandatory.

## 4. Android architecture

Use a single Android application module with feature-based packages to avoid needless modularization. Layers:

```text
Compose UI
   ↓ user intent / StateFlow
ViewModel
   ↓
Use case / domain rule
   ↓
Repository interface
   ├─ Room DAO (source of truth)
   ├─ Outbox DAO
   ├─ Firestore network reader (online only)
   ├─ Callable command client
   └─ Firebase AI Logic client
```

The UI observes Room-backed Flows. No Composable queries Firestore or calls AI directly. ViewModels expose immutable screen state and send actions to use cases. Domain logic is Kotlin-only and unit tested.

Recommended packages:

- `core/model`, `core/database`, `core/security`, `core/sync`, `core/network`, `core/locale`, `core/designsystem`
- `feature/auth`, `feature/workspace`, `feature/classes`, `feature/pupils`, `feature/attendance`, `feature/lessons`, `feature/progress`, `feature/messages`, `feature/ai`, `feature/settings`

## 5. Local persistence

Room is the local source of truth. SQLCipher encrypts the database. Encryption key is generated/managed by Android Keystore and never stored in plaintext. Keep Firestore SDK disk persistence disabled to avoid a second uncontrolled cache of pupil/guardian data.

Room tables include workspace cache, membership cache, classroom, pupil, guardian, pupil-guardian link, curriculum pack metadata, lesson plan, teaching resource, attendance session, attendance entry, progress entry, conversation, message, notification status, outbox command, sync cursor and local audit item.

Local writes use Room transactions. For an offline action, the domain mutation and outbox record must be saved together. The UI reflects local persistence immediately and labels the record as pending sync.

## 6. Synchronization engine

- WorkManager worker runs only when `NetworkType.CONNECTED`.
- If teacher selected Wi-Fi-only, require `UNMETERED`; manual Sync Now can ask for one-time permission to use metered data.
- Batch max 20 commands per `syncCommands` callable invocation.
- Each command has UUID idempotency key and schema version.
- Server returns per-command result: `accepted`, `alreadyApplied`, `conflict`, `rejected`, `retryable`.
- Retryable errors use exponential backoff with jitter; max 10 automatic attempts then `needsAttention`.
- Permission/validation errors are permanent until teacher action.
- Conflict resolution uses `expectedVersion`; never auto-overwrite attendance or progress.
- Cloud snapshots update Room only if server version is newer and no conflicting local pending edit exists.

Firestore's built-in offline cache and last-write-wins are not used as the application's sync policy. See official docs: https://firebase.google.com/docs/firestore/manage-data/enable-offline

## 7. Cloud architecture

### Firestore

- Edition: Standard.
- Region: `africa-south1` (Johannesburg).
- Use nested workspace collections to make tenant scope explicit.
- All writes from Android denied by rules. Use callable functions.
- Firestore reads use authenticated SDK and workspace-scoped queries with indexes.
- Use a dedicated `members/{uid}` document for membership checks.

### Functions

- Generation: 2nd gen.
- Runtime: Node.js 22, TypeScript.
- Region: `africa-south1`.
- Callable functions require Firebase Auth and App Check.
- Provider webhooks are HTTP endpoints, verify HMAC before parsing/acting on content.
- Use Secret Manager-backed secrets for provider API key and webhook secret.
- Configure minimum/maximum instances and concurrency to conservative cost-safe values.

### Scheduled work

One scheduled function runs at Friday 15:00 `Africa/Lagos` and creates weekly digest jobs in bounded pages. Outbound SMS uses a Firestore outbox worker triggered by job creation or a scheduled drain. Every send job is idempotent.

### Push

FCM is optional. Payload contains no child details. If unavailable (no Google Play services, no network), teacher reads inbox on app open and through scheduled WorkManager sync.

## 8. Data location and processing

Firestore and Functions use `africa-south1`; this is not Nigeria. It is a cross-border data location and must be included in the DPIA/processing agreement. Firebase AI Logic using Gemini Developer API uses global model access and location cannot be selected. Therefore cloud AI requests are restricted to de-identified generic teaching context. Do not send pupil or guardian records. For a production pilot, school controller/processor roles, cross-border transfer safeguards and provider terms must be reviewed before enabling live data processing.

## 9. AI architecture

Firebase AI Logic in Android. On-device library is separate from the main Firebase BoM and currently beta/experimental. The on-device Prompt API needs min API 26 and compatible hardware. Use capability check before calls; model download is opt-in and Wi-Fi-preferred. The on-device API is single-turn and only English/Korean validated in current documentation. Tiny uses English only for on-device tasks. Hausa/Yoruba/Igbo/Pidgin AI generation uses cloud when connected; offline fallback is a reviewed static template or teaching library.

Use cases:
- On-device: short English explanation simplification / one classroom strategy, low output token budget.
- Cloud: richer 5E lesson adaptation, structured question generation, multilingual rewriting of de-identified teacher text.

No tools or autonomous actions. Model output is parsed, validated and presented as draft. `inferenceSource` is recorded in non-PII AI usage telemetry.

## 10. Messaging architecture

One product-level eSMS Africa shared keyword (`TINY`) is used across workspaces. School code is part of first inbound message for routing. Provider cost is not replicated per school. Parent phone must match a verified guardian contact. If phone maps to multiple schools, school code is mandatory. If multiple pupils remain ambiguous, ask for a pupil code; do not reveal child details until resolved.

Outbound and inbound message processing is asynchronous:

```text
Domain event → notification/message job → budget + consent checks
   → provider adapter → eSMS API → provider message ID
   → signed delivery webhook → status update
```

Inbound:

```text
eSMS webhook → raw-body HMAC verification → event dedupe
   → E.164 sender match + school code resolution
   → conversation create/append → teacher inbox
```

Never invoke eSMS directly from the Android client.

## 11. Deployment topology

- Android APK/AAB distributed through Firebase App Distribution for protected preview and test.
- Firebase project with separate development/staging and production projects if available; never point preview at production data.
- Firebase Emulator Suite for Auth/Firestore/Functions integration tests.
- GitHub Actions Ubuntu runners build the APK, run unit/lint and Functions tests; secrets stored in GitHub Actions secrets only when required. Do not install the full Android Studio toolchain on the operator Windows machine.
- Current operator budget is Spark/NGN 0. Cloud Functions are emulator-only: do not deploy Functions, activate Blaze or introduce paid hosting without explicit operator approval. This is an operational constraint, not a change to the fixed Functions architecture.
- Production release requires explicit authorization and a completed security/DPIA/provider readiness gate.

## 12. Architecture constraints and rejected approaches

- No web frontend in MVP. Native Android is the product frontend. Early “preview deployment” means protected APK distribution with a precise release/build URL and commit, not inventing a website.
- No Firestore-only offline implementation due last-write-wins.
- No client-side direct database writes to authoritative records.
- No separate managed relational SQL database (such as Cloud SQL/PostgreSQL), microservices, Cloud Run service, message broker, Redis or search engine in MVP. Room/SQLite is still used locally on Android.
- No parent-facing app or separate parent web portal.
- No real voice calls until later.


## 12. Firebase developer-agent tooling (not runtime dependencies)

Tiny's implementation agent uses the official Firebase Agent Skills for Firebase-specific guidance and the Firebase MCP server as a controlled tool interface. These developer tools are not packaged into the Android APK and do not alter the application architecture.

- OpenCode project-local skills: `firebase-basics`, `firebase-local-env-setup`, `firebase-auth-basics`, `firebase-firestore-standard`, and `firestore-security-rules-auditor`. Optional Crashlytics skill is added only if Crashlytics is approved. See `docs/FIREBASE_AGENT_SKILLS_AND_MCP.md`.
- Firebase MCP: local stdio server using Firebase CLI credentials, disabled until a non-production project and operation permissions are authorized. Restrict exposed feature groups to core/auth/firestore/functions; add messaging only if optional FCM is approved; add crashlytics only if its use is separately approved.
- MCP read access may be used for authorized non-production inspection/validation. Any state-changing operation (project/app/database creation, Auth user/config mutation, Firestore writes/deletes, deploy, FCM send, backup/config change) requires exact operator authorization.
- The Firebase Agent Skills catalog's `firebase-ai-logic-basics` entry is described as web-focused. It is not an authority for Tiny's native Android hybrid inference; use current Android-specific Firebase AI Logic documentation and physical-device verification.

