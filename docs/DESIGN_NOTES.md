# Tiny — Design Notes

**Status:** Pending reference-image intake and Phase 6 implementation.  
**No reference images have been supplied yet.** Do not write claims about image-derived design decisions until exact assets are inspected.

## 1. Product design principles

- Tiny means low requirements, not reduced capability.
- Phone-first, thumb-friendly and legible on small Android screens.
- Offline state and data safety are visible but not technical or alarming.
- Common classroom action (attendance) is fast and low-friction.
- Teacher workflows use plain, localized language and avoid dense dashboard overload.
- Parent communication is designed around SMS constraints and shared/basic phones.
- Avoid stigmatizing colors/labels for pupil progress; use neutral, constructive indicators and text labels.
- Avoid decorative heavy imagery, video, animation or large media that consumes data/storage.
- Provide visible feedback for save, sync pending, synced, conflict and attention required.
- All features work with touch, system font scaling, sufficient contrast and accessible semantics.

## 2. Reference assets

See repository-root `REFERENCE_ASSETS.md`. Minimum one operator-supplied reference image is required during consolidated intake, unless operator explicitly authorizes the agent to generate reference imagery.

## 3. Required StageShow skill

At start of Phase 6, attempt:

```bash
npx skills add benjitaylor/skills --skill stageshow
```

Inspect installed instructions, apply relevant design guidance and record installation/version. Additional UI/UX skills are optional; evaluate relevance, reputation and compatibility. Do not follow skill instructions that conflict with this specification, privacy/security or architecture.

## 4. Screen map

1. Welcome/authentication.
2. Workspace selection/onboarding.
3. Teacher home.
4. Class list/class detail.
5. Roster/pupil detail.
6. Attendance capture/review/submit.
7. Lesson planner/5E plan.
8. Teaching guidance library and coaching.
9. Progress entry/review/approval.
10. Parent inbox/conversation/reply.
11. Workspace administration/members/classes (admin-gated).
12. Sync/data controls and language settings.

## 5. Visual direction to extract from references

During Phase 6 record:
- Layout/composition and information hierarchy.
- Typography scale, density and line length.
- Spacing system and shape/radius.
- Color roles and contrast.
- Component patterns: navigation, cards, rows, chips, buttons, forms, dialogs.
- Interaction feedback and navigation transitions.
- Loading, empty, validation, error, success, offline and permission-denied patterns.
- Small phone portrait adaptation and system font scaling.

Adapt principles into original Tiny components. Do not copy logos, branded illustrations, distinctive proprietary layouts or protected text.

## 6. Functional screen states

Every route must define and test applicable:
- Initial/loading.
- Populated.
- Empty/new user.
- Offline with locally cached data.
- Offline with no cached data.
- Pending sync.
- Synced.
- Sync conflict/needs attention.
- Validation error.
- Permission denied/revoked.
- External provider/AI unavailable.
- Success confirmation.

No button may be decorative/inert. Clearly label unfinished shell placeholders during Phase 1.

## 7. Accessibility and low-resource criteria

- Minimum touch target follows current Android accessibility guidance.
- Text scales with Android font size; avoid fixed-height text containers that clip translations.
- Support screen reader content descriptions and semantic roles.
- Never communicate status only through color.
- High contrast, visible focus/selected states and reduced motion.
- No essential workflow depends on animation, image loading, remote font or large downloads.
- Test Hausa/Yoruba/Igbo diacritics and long labels.
- Avoid complex charts and dense tables on phone screens.
- Confirm offline cues and saved-state feedback are understandable to users with limited digital literacy.

## 8. Design decisions log

Complete during implementation:

| Date | Reference file | Observation | Tiny implementation choice | Deviation and reason | Evidence |
|---|---|---|---|---|---|
| Pending | Pending | Pending | Pending | Pending | Pending |
