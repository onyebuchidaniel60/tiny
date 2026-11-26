# Tiny — Design Notes

**Status:** Phase 1 visual foundation implemented; final app refinement and accessibility audit pending.

## 1. References

- **REF-001:** https://www.framer.com/marketplace/templates/atelio-studio/ — visual personality reference only. Warm riso-print energy, serif display type, ink outlines, offset shadows, hand-drawn details, tomato/cobalt/butter palette. Limited licence; no source, illustrations, assets, copy or branding copied.
- **REF-002:** https://pass-web-dun.vercel.app/ — structural/storytelling reference only. Hero → problem → solution → steps → features → final CTA → substantial footer, with product demonstrations embedded in the page. No copy or assets copied.

## 2. Product design principles

- Tiny means low requirements, not reduced capability.
- Phone-first, thumb-friendly and legible on small Android screens.
- Offline state and data safety are visible but not technical or alarming.
- The common classroom action (attendance) is fast and low-friction.
- Teacher workflows use plain, localized language and avoid dashboard overload.
- Parent communication is designed around SMS and shared/basic phones.
- Avoid stigmatizing colors/labels for pupil progress; use neutral, constructive labels.
- Avoid heavy imagery, autoplay video, remote fonts or large media.
- All features work with system font scaling, sufficient contrast and accessible semantics.
- Clearly label preview, mock and planned states. Never fake success.

## 3. Visual system implemented

- **Palette:** paper `#F8F1E2`, ink `#1D2A24`, forest `#1E5B48`, tomato `#D85C3D`, cobalt `#255AA8`, butter `#F1C453`.
- **Type:** serif display headings (Georgia/`FontFamily.Serif`), sans body (system sans). Strong hierarchy, generous line height, no remote font dependency.
- **Shape:** rounded cards (12–32 dp), 1 px ink outlines, restrained offset shadow, warm surfaces.
- **Motifs:** original CSS/Compose doodles, dots, underline squiggles and a text-first Tiny mark. No third-party illustration or logo copied.
- **Android:** Compose Material 3 palette/typography/shapes; 48dp+ targets; labelled placeholders; mock/preview banners.
- **Landing page:** same palette/type; responsive desktop/tablet/phone; semantic sections; skip link; focus states; reduced-motion handling; no analytics/cookies.

## 4. Screen map

1. Welcome/language selection — implemented.
2. Preview welcome — implemented.
3. Teacher home — implemented with synthetic data.
4. Class list/class detail — implemented.
5. Attendance capture/submit — implemented locally.
6. Lesson planner/5E detail — implemented.
7. Progress entry/approval — implemented locally.
8. Parent inbox/conversation/mock reply — implemented.
9. Settings/language/sync/privacy — implemented.
10. Sync center — implemented with honest mock state.
11. Landing page — implemented.
12. Workspace administration/members — planned Phase 3/4.

## 5. Functional states

The shell covers initial/loading-ish seeding, populated, empty, offline/local, pending sync, mock sync, validation error/snackbar, and permission/placeholder labels. Remaining states to audit before release:

- Empty new-user workspace creation.
- Offline with no cached data.
- True sync conflict/needs-attention flows.
- Permission-denied/revoked membership.
- External provider/AI unavailable.
- Success confirmation at every write path.
- Large font, landscape/tablet and TalkBack passes.

## 6. Accessibility and low-resource criteria

- Minimum touch target 48dp in Compose; web controls use generous padding and focus rings.
- Dynamic font scaling via Compose and responsive CSS.
- Status is not communicated by color alone; text labels accompany color.
- No essential workflow depends on animation, image loading or remote fonts.
- Landing page supports reduced motion and keyboard focus.
- Native-language diacritics and long labels still need device/visual testing.
- Curriculum/lesson content is deliberately text-first and small.

## 7. Design decisions log

| Date | Reference | Observation | Tiny implementation choice | Deviation/reason | Evidence |
|---|---|---|---|---|---|
| 26 Nov 2026 | REF-001 | Warm riso/ink/doodle personality | Original paper/ink/forest/tomato/butter system | Avoid copying limited-licence assets | `landing/styles.css`, Compose theme |
| 26 Nov 2026 | REF-002 | Long-form product storytelling | Full landing page with 12 sections | Use structure, not copy | `landing/index.html` |
| 26 Nov 2026 | Both | Product proof cards | Original phone mockups and feature cards | Synthetic data only; label preview | `artifacts/screenshots/` |
| 26 Nov 2026 | — | StageShow unavailable | Direct design-system discipline | Harness removed skill ID after restart | Build log/handoff |

## 8. Known design/UX gaps

- Full Hausa/Yoruba/Igbo UI translation coverage and native review.
- Final app screenshot-by-screenshot reference refinement.
- Real-device validation on Note 10+ (Android 12) and larger-font TalkBack pass.
- Sync conflict/needs-attention UI not yet exercised end to end.
- Landing page GitHub Pages publication not yet verified.
