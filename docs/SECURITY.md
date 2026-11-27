# Tiny — Security and Privacy Architecture

**Security posture:** privacy-first, least privilege, offline-aware, and closed by default for paid or production integrations.  

**Current preview status (27 November 2026):** Synthetic data only; mock SMS; local SQLCipher database. The non-production Firebase project `tiny-b9f29` is configured with Firestore rules/indexes and Auth; Functions are not deployed. Firestore rules are class-scoped for pupils, guardians, links, conversations and messages and pass 9/9 emulator tests; live unauthenticated and non-member reads are denied while a synthetic member can read its workspace/class/pupil. Phone Auth uses two synthetic test numbers; no real SMS. App Check enforcement is off. The protocol-test token was revoked; a private CI token is stored in GitHub secrets, and a dedicated judge debug token is intentionally embedded in the public synthetic preview APK for the hackathon and must be revoked after judging. A full review is still required before a pilot. No production security certification is claimed.
**Scope:** this is an engineering control specification, not a substitute for Nigerian legal advice, a DPIA, controller/processor agreements or a school safeguarding policy.

## 1. Information classification

| Classification | Examples | Handling |
|---|---|---|
| Public | App name, public help content, approved public curriculum metadata | May be published after rights review |
| Internal | Workspace IDs, class labels, teacher settings, operational status | Authenticated workspace access only |
| Personal | Teacher name/phone, guardian name/phone, community location | Least privilege, encrypted transport/storage, minimized logs |
| Child educational data | Pupil display name, class, attendance, progress observations, parent links | Restricted to authorized school staff and necessary service functions; no public access |
| Secrets | SMS API key, webhook secret, service-account credentials, CI secrets | Secret Manager/CI vault only; never source, client APK, Firestore documents or logs |

## 2. Threat model and mitigations

| Threat | Example | Required control |
|---|---|---|
| Broken authentication | Stolen teacher session or OTP abuse | Firebase Auth, OTP throttling, secure device lock, revocation, no tokens in logs |
| Broken authorization / IDOR | Teacher changes `workspaceId`, `classId` or `pupilId` | Server checks active membership and assigned class on every command; Firestore rules scope reads; opaque IDs are not authorization |
| Cross-tenant leakage | Query returns pupils from another school | Tenant-nested data, workspace-scoped queries, rule tests, server-side membership check, E2E negative tests |
| Privilege escalation | Teacher calls admin operation directly | Role checked in callable from membership record; never trust UI-hidden actions or client role |
| Insecure local data | Phone lost or shared | SQLCipher Room, Keystore-backed key, app/device lock, minimize cached fields, local workspace revoke handling |
| Stale offline authorization | Revoked teacher continues offline | Display last authorization/sync time; define bounded offline grace policy before pilot; reject writes on reconnect; clear/restrict workspace cache after signed revocation fetch; document inability to remote-wipe offline phone |
| Webhook spoofing | Attacker posts fake inbound SMS | HMAC on raw body, timestamp/replay check, event dedupe, strict schema, rate limits |
| Replay/duplicate action | SMS webhook or attendance sync repeats | Durable receipt/idempotency keys, payload hash, unique constraints, transaction |
| OTP enumeration/brute force | Determine valid accounts or send OTP floods | Generic responses, Firebase quotas, rate limits, abuse alerts, test-number isolation |
| Injection | Untrusted message/resource data enters queries | Schema validation, parameterized SDK operations, output encoding; no dynamic query construction from user strings |
| XSS/HTML injection | Message rendered as HTML in a future view | Render as text; Compose safe text; sanitize rich text only if later introduced |
| CSRF | Web admin endpoint abused | MVP callable APIs with Auth/App Check; if browser endpoints are introduced later, CSRF defenses required |
| SSRF | User-supplied source URL fetched by backend | No arbitrary URL fetch in MVP; if curriculum import tooling added, strict allowlist, DNS/IP validation and egress controls |
| Secret leakage | API key in APK/log/commit | Server-only Secret Manager; CI secret scanning; gitignore; redact logs; rotate on exposure |
| PII leakage to AI | Pupil report sent to model | Prompt minimization; no child/guardian identifiers or raw report; automated PII tests; AI task input contract |
| Prompt injection | Teacher note attempts to override system rules | Treat all user text as untrusted; no tools/actions; strict output schema; model is not authority; human approval |
| Misleading AI output | Model invents child progress | AI cannot assess a child; only rephrase de-identified factual teacher input; reject new factual claims; teacher approval |
| Message abuse/spam | Compromised teacher sends large volumes | Per-UID/workspace rate limits, consent check, budget/segment ceiling, provider-level limits, audit events |
| SMS privacy disclosure | Wrong guardian receives child's details | Verified number and active pupil link; ambiguous mappings require school/pupil code; minimal SMS; no detailed reports in messages |
| Unicode segment/cost abuse | Long text creates many paid segments | Character and segment caps, template limits, pre-send segment estimate, budget gate, bounded retries |
| Race conditions | Two teachers submit attendance simultaneously | Unique class/date session key, transaction, first valid submission wins, corrections append-only |
| Data loss | Device/app terminated while offline | Domain mutation + outbox in one Room transaction; restart tests; backups/sync when connected |
| Malicious/corrupt update | Modified app calls backend | App Check Play Integrity, Auth, server validation; App Check is defense-in-depth, not authorization |
| Supply-chain risk | Compromised library/skill | Pin versions, lockfiles, inspect skill instructions, reject conflicting instructions, dependency scanning, minimal dependencies |

## 3. Identity and authorization controls

- Teachers and school administrators authenticate with Firebase Phone Auth.
- Parent SMS sender identity is a verified phone endpoint, not a login account. Phone possession verification does not establish legal guardianship; the school/teacher must separately verify the pupil/guardian relationship through its normal process.
- No guardian can access the teacher app or Firestore.
- Every workspace-owned read is scoped to an active membership; every write is a Cloud Function command with an explicit role/class permission check.
- Direct client writes to authoritative Firestore records are denied.
- School admin is not a global Tiny super-admin.
- Role changes, invitation acceptance/revocation, pupil transfer, attendance corrections and progress approvals create audit records.
- Unknown or ambiguous sender messages receive a generic routing response and no pupil-specific information.

## 4. Local device controls

- Room database encrypted using SQLCipher; key is created and protected via Android Keystore.
- Keep Firebase Firestore persistent disk cache disabled in Android to avoid a second unencrypted store of sensitive records.
- Do not store Firebase ID tokens, provider keys or service credentials in Room/DataStore.
- Cache only classes/pupils necessary for the user's authorized workload; do not bulk-download all school data.
- Device notification payloads must not include pupil names, progress or message body. Show generic “New school message” notification.
- Provide logout/workspace removal that deletes local encrypted cache and key after a clear confirmation, while preserving server records.
- If app lock/biometric is used, it protects local access only; it is not server authorization.
- Device compromise/root status may be used as risk signal, but do not block low-cost phones solely based on a blanket root heuristic without a defined policy.

## 5. Webhook security

For eSMS callbacks:
1. Preserve raw body bytes.
2. Verify HMAC-SHA256 using the provider-defined exact canonicalization and secret; use constant-time comparison.
3. Reject missing/invalid signature before parsing/acting.
4. Validate service/keyword, event type, content length, sender number and required fields.
5. Check event timestamp freshness if supplied; persist unique provider event receipt to prevent replay.
6. Resolve sender through keyed phone hash index and active verified guardian data.
7. If more than one school/child match remains, request routing detail; never guess.
8. Commit inbound message and webhook receipt transactionally where possible.
9. Return provider-required successful acknowledgement only after durable acceptance.
10. Record event IDs/correlation IDs, not sensitive body or API secrets, in logs.

## 6. AI security and safety

- No raw pupil record, name, guardian identity, phone, attendance record or child progress report leaves the device for AI.
- Only generic/de-identified subject, curriculum objective ID, teacher challenge category and non-identifying free-text may be used.
- Treat teacher-entered strings and retrieved resources as untrusted prompt content.
- No model tools, external web access, database writes, notification sending or autonomous actions in MVP.
- Parse structured output; enforce schema, string limits, locale and allowlisted IDs; reject malformed or unsupported results.
- AI cannot make diagnoses, grades, rankings, behavioral labels, attendance judgments or safeguarding decisions.
- Every parent-facing AI-assisted statement must be reviewed and approved by a teacher.
- Store inference source and non-PII usage metadata only; avoid storing raw prompts/outputs unless a future retention and consent design is approved.
- Cloud inference uses global Gemini Developer API processing. DPIA/legal review must evaluate this before any real pupil data pilot; the product must still not send pupil PII.

## 7. Privacy and Nigerian data protection readiness

Tiny handles children's educational information and contact data. Before a live school pilot:

- Identify the data controller(s) and processor(s) for each school deployment; do not assume one universal role.
- Determine and document a lawful basis for each processing purpose.
- Provide a clear privacy notice to school, teachers and parents/guardians in understandable languages.
- Determine whether parental/guardian consent is the appropriate basis for the relevant processing and document applicable statutory exceptions with qualified counsel/DPO. Do not assume every processing operation has the same consent rule.
- Complete a Data Protection Impact Assessment before high-risk processing where required, and before the pilot as the product's release gate.
- Review international transfer/cross-border processing because Firestore/Functions are planned in Johannesburg and Gemini processing is global.
- Put provider data processing terms, retention, security and subprocessors under review.
- Define access requests, correction, erasure, retention and breach response procedures.
- Minimize children's data, never collect sensitive fields without a separately approved need, and do not expose records in SMS beyond necessary information.
- Confirm school safeguarding and escalation procedure for concerning parent messages; Tiny is not an emergency response service.

The Nigeria Data Protection Act 2023 and current NDPC guidance must be consulted by the responsible controller/DPO/legal adviser. This document does not provide legal advice or determine the legal basis.

## 8. Logging, monitoring and incident response

- Use structured logs with correlation ID, function name, actor UID hash, workspace ID, error code and latency where appropriate.
- Never log OTP, auth tokens, provider credentials, full guardian phone, full pupil records, progress notes or SMS body.
- Use separate access-controlled audit records for business events.
- Alert on unusual OTP volume, webhook signature failures, permission denials, provider failure spikes, unexpected segment usage, budget threshold and AI quota spikes.
- Define incident owner, provider escalation contact, key rotation and school notification procedure before pilot.
- Rotate exposed credentials immediately; revoke affected sessions and webhook secrets where needed.

## 9. Security release gate

Production/pilot is blocked until:

- Cross-tenant and class-scope authorization tests pass.
- Webhook signature/replay tests pass.
- Attendance/idempotency/concurrency tests pass.
- Local database encryption/key-loss behavior is tested.
- No PII in AI prompts/logs/FCM payloads is verified by automated tests.
- SMS consent/opt-out and recipient verification are tested.
- DPIA, privacy notice, controller/processor roles and data transfer review are signed off by the responsible parties.
- Data retention/deletion policy is approved.
- No unresolved critical/high security finding remains.
- Production messaging and release authority are explicitly granted.
