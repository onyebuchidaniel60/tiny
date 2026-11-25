# Tiny — SMS and Parent Communication Operations

## 1. MVP communication model

Tiny uses SMS as the parent's primary channel. There is no parent app and no real-time chat promise.

Supported MVP communication:
- Immediate absence notification after server acceptance of attendance.
- Weekly digest with approved attendance/progress/achievement/school information.
- Parent-initiated free-text SMS.
- Teacher replies through Tiny's teacher inbox.
- Basic parent callback request, recorded for teacher action (no automated voice call in MVP).

Voice calls and USSD are future options, not MVP dependencies.

## 2. Provider choice

**Selected provider:** eSMS Africa Two-Way SMS, subject to Phase 0 account/sandbox validation. It documents Nigerian shared-keyword support, inbound webhook callbacks, sandbox/test facilities and delivery status mechanisms. Twilio is not selected because current Twilio country capability documentation does not list Nigeria two-way SMS availability.

Production service provisioning, sender/short code, shared keyword, KYC and exact price must be confirmed with provider before use. Do not assume a shared keyword is automatically available to Tiny.

## 3. Shared keyword and school routing

Use one product-level keyword/service `TINY`, not a separate paid keyword per school. This is essential to keep recurring provider overhead independent of the number of schools.

First general inbound message format:

```text
TINY <school-code> <message>
```

Guardian phone verification format:

```text
TINY <school-code> JOIN <one-time-code>
```

The teacher generates a cryptographically random one-time code and shares it in person after explaining the school communication notice. The platform does not send child-specific information to the unverified phone. The parent must send the code from the phone to be registered. The code expires after 7 days, is single-use, allows at most 5 failed attempts and is stored only as a strong hash. The inbound webhook validates sender number, workspace school code, code hash and expiration before linking the phone. A successful JOIN confirms possession of that handset and affirmative opt-in for the stated SMS categories; the legal basis and exact notice text must still be approved by the controller/DPO. It does not by itself prove that the person is legally entitled to act as the pupil's guardian: the school/teacher separately verifies the relationship under its normal enrollment/guardian process. If the parent cannot send the verification SMS, the contact remains pending and is not eligible for child-specific outbound communication.

Examples:

```text
TINY KOFAR001 JOIN B8F3Q9KD
TINY KOFAR001 My child is sick today.
TINY KOFAR001 Please ask the teacher to call me.
1 A7KD
```

Rules:
- School code is a routing hint, not an authentication secret. Workspace codes are 8 uppercase characters generated server-side from an ambiguity-reduced alphabet, unique and never reused; show it in workspace settings and explain it to parents.
- Sender phone must match a currently verified guardian contact before child-specific records are disclosed.
- If a guardian endpoint has links to several schools, school code is required. Within one workspace, one phone maps to one Guardian contact endpoint and may link to multiple pupils.
- If multiple pupils are associated with that endpoint and the subject is unclear, ask for the pupil's local code or a short menu selection; never guess. A shared household phone is treated as one endpoint and cannot reliably identify which adult is sending.
- Unknown/unverified sender gets generic help only; do not reveal whether a pupil, guardian or school record exists.
- Once a provider conversation context is active, plain replies can be associated only if unambiguous and within provider's documented window; otherwise request code again.
- Message text is not a safe authorization credential.

## 4. Notification rules

### Attendance

- Notify only for `absent` after the server accepts the complete attendance session.
- `present` and `late` have no immediate SMS.
- Send to every active, linked, verified and opted-in guardian endpoint.
- Deduplicate equivalent sends to the same phone endpoint for same pupil/session/template/language. Each job has a short response reference used only to correlate parent menu replies.
- If shared phone is linked to multiple pupils, do not combine unrelated child information unless the verified guardian context and digest grouping explicitly permit it.
- If a later correction changes absence to present, queue a correction message where an absence notice was already delivered or accepted; do not erase history.

### Weekly digest

- Friday 15:00 `Africa/Lagos` initially.
- One digest per guardian per workspace per week; consolidate linked pupils in the same workspace.
- Include only approved/available data: attendance, progress, achievements, practical home suggestion, school announcement.
- Never interpret missing data as poor performance.
- Target maximum two SMS segments; remove optional lower-priority sections before dropping facts. If essential content cannot fit, send a concise summary plus teacher callback instruction.
- Do not silently truncate pupil names, dates or factual statements.

### Teacher reply

- Teacher writes reply in Android inbox; server stores message and send job atomically.
- Server checks teacher's workspace/class permission, guardian link, locale, opt-out and messaging budget.
- Message state: `queued -> accepted -> delivered|failed|unknown`.
- Provider API accepted is not equivalent to delivery.
- Never expose personal teacher number.

## 5. Consent and opt-out

- Contact can be entered with status `pending`; no child-specific outbound message before verification and required communication permission are recorded.
- The school/teacher records how the guardian contact was collected and how the guardian was informed.
- `STOP` suppresses all non-essential outbound communications to that endpoint according to provider and applicable law; send only a generic opt-out confirmation if provider/legal policy permits.
- `START` is not sufficient by itself to re-enable if identity/relationship/consent must be re-confirmed. Implement approved re-subscription flow.
- Essential communication categorization and consent basis must be reviewed by the controller/DPO. Do not assume a blanket consent checkbox handles every message type.
- Unlinking a guardian or revoking verification immediately prevents child-specific future sends.

## 6. Provider webhook behavior

Inbound and delivery endpoints:
- `POST /webhooks/esms/inbound`
- `POST /webhooks/esms/delivery`

Use the provider's documented HMAC-SHA256 signature header and exact raw-body canonicalization. At current documentation snapshot, the signature header is documented as `X-Webhook-Signature`, with a `sha256=` hex digest format; verify this again against the live account/docs before enabling. Use timing-safe comparison.

Webhook sequence:
1. Read raw bytes.
2. Verify signature; reject invalid signature.
3. Validate payload shape and maximum size.
4. Validate timestamp/replay window if present.
5. Deduplicate provider event ID.
6. Normalize sender and route school/guardian safely.
7. Persist receipt/message transactionally.
8. Acknowledge provider only after durable acceptance.

Do not log message text, phone number or signature secret. Store provider message/event IDs for traceability.

## 7. Cost controls

Current provider documentation snapshot (25 Nov 2026) includes illustrative Nigeria pricing examples: one-time shared keyword setup, monthly keyword fee and per-segment inbound/outbound fees. The examples observed during research were approximately USD 100 setup, USD 50 monthly and USD 0.0068 per SMS segment; these are not a quote and can change. The provider documentation instructs customers to retrieve current pricing before activation.

At intake and again immediately before production activation:
- Fetch a live quote for Nigerian destination networks and selected shared keyword/number.
- Confirm VAT, minimum top-up, setup, monthly rental, inbound/outbound rates, Unicode segment calculation and delivery callback costs.
- Confirm business-registration/KYC requirements and approval timeline.
- Set monthly USD/NGN ceiling and daily segment ceiling.
- Configure a closed-by-default budget guard in backend.
- Do not automatically top up or charge teachers/parents.
- Provider outages/low balance leave jobs queued or failed with visible operational status; do not endlessly retry and multiply charges.

No budget is approved in this handoff. Production SMS remains disabled. Sandbox/demo only.

## 8. MVP operational metrics

Track without exposing message contents:
- Number of inbound/outbound segments.
- Provider accepted/delivered/failed/unknown rate.
- Delivery latency buckets.
- Webhook signature failures and duplicate events.
- Spend estimate vs approved cap.
- Opt-out rate.
- Messages suppressed for unverified guardian/consent.
- Digest segment count and dedupe count.

## 9. Test cases

- Parent sends valid first message with keyword + correct school code.
- Parent sender is unverified; no child data returned.
- Parent has multiple school associations; code required.
- Parent has multiple children; child-specific route clarified.
- Same phone number on duplicate guardian links receives a deduplicated appropriate notification.
- Parent sends STOP; non-essential sends suppressed.
- Invalid HMAC rejected; valid duplicate webhook processed exactly once.
- Delivery callback changes state to delivered/failed; no callback remains unknown.
- Provider outage and low balance produce bounded retry/no runaway spending.
- Hausa/Igbo/Yoruba/Pidgin templates maintain Unicode and segment estimates.
