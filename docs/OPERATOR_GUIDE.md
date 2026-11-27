# Tiny — Operator Guide (MVP)

**Audience:** Authorized school administrators and Tiny operators.  
**Status:** Operational specification; update screenshots and exact steps after implementation.

## 1. Workspace onboarding

### School-managed workspace

1. A school representative creates the school workspace in Tiny.
2. The workspace starts as unverified until the approved verification process exists.
3. The creator is the initial school administrator.
4. The administrator invites teachers using verified mobile numbers.
5. Teachers accept invitations after authenticating their own accounts.
6. The administrator assigns classes to teachers.

### Independent teacher workspace

1. Teacher creates an account and chooses “Start independently”.
2. Teacher enters workspace name and basic community location.
3. Teacher becomes workspace owner and teacher.
4. Teacher creates classes, registers pupils and guardians.
5. The teacher can later accept an invitation to an existing school. Existing data is not automatically merged or transferred; any data migration is explicit and audited.

## 2. Teacher responsibilities

- Keep class rosters current and archive transferred pupils correctly.
- Verify guardian contact details and record consent/communication basis according to school policy.
- Select guardian language preference rather than infer it.
- Download required curriculum packs when connected and on an approved data connection.
- Mark all pupils before submitting attendance.
- Review progress notes for factual, constructive language.
- Approve parent-facing progress information before it is shared.
- Monitor sync and resolve `Needs attention` items.
- Use school communication channels responsibly and do not enter sensitive medical or safeguarding details in ordinary SMS.

## 3. Attendance operating rule

- One submitted register per class per school date.
- Every active pupil requires one status: present, absent or late.
- Only absent entries trigger immediate alerts.
- Submission is final; corrections require a reason and are recorded as amendments.
- If no signal exists, Tiny stores the register locally and syncs later. Parents are not notified until the server accepts the submission and the provider can process messages.

## 4. Parent communication

- Parents can receive absence alerts and weekly digests through SMS.
- Parents can initiate a message using `TINY <school-code> <message>`.
- Tiny links incoming sender only after matching a verified guardian number; ambiguity requires additional school/pupil context.
- Teachers reply from Tiny; their personal phone numbers are not exposed.
- SMS is asynchronous; no instant response guarantee is made.
- Provider delivery status may be `accepted`, `delivered`, `failed` or `unknown`. Provider acceptance is not delivery.
- STOP/opt-out requests must be honored under approved consent/policy configuration.

## 5. Progress reporting

Use only observed, factual descriptions. The three positive/developmental indicators are not examination grades. `not_assessed` means no assessment was recorded for that reporting period, not that the pupil failed.

Teacher notes are private drafts until approval. Before approval:
- Verify the correct pupil, subject and period.
- Avoid labels, diagnoses and unsupported comparisons.
- Avoid disclosing sensitive family/health information.
- Give practical, realistic support ideas where useful.
- Confirm the preferred guardian language and linked recipient.

## 6. Data protection and safeguarding

- Do not use live pupil/guardian data in demo or development environments.
- Access only records needed for your assigned responsibilities.
- Never share OTP, teacher credentials or invitation tokens publicly.
- Report lost devices promptly so access can be revoked; offline devices cannot be remotely wiped until they reconnect.
- Escalate safeguarding or urgent welfare concerns through the school's approved human safeguarding process. Tiny is not an emergency or crisis service.
- Follow approved retention/deletion policy; do not delete school records informally.

## 7. Tiny operator tasks

The MVP has no global platform admin dashboard. Restricted Firebase/Google Cloud access is used for operational tasks:
- Monitor function errors, sync backlog, provider delivery and spend.
- Manage eSMS secrets and webhook configuration.
- Control SMS mode, budgets and allowed test recipients.
- Review audit events for documented support/security incidents.
- Disable outbound provider sends if abuse, compromise or unexpected cost is detected.
- Keep the synthetic browser preview and judge App Check tokens available through the judging period; revoke them after judging.
- Treat browser-local data as synthetic only. It is not covered by the Android SQLCipher backup/recovery model.
- Respond to incidents under the approved response plan.

Every privileged operation must be attributable and logged. Routine operator browsing of pupil records is not permitted.

## 8. Backup and recovery

Before a live pilot, document and test:
- Firestore export/backup schedule and access control.
- Recovery time and recovery point expectations.
- How to restore in a non-production project first.
- How to preserve audit and attendance amendment history.
- How to notify affected schools after an incident.

Do not run data deletion or restore operations without explicit authority.
