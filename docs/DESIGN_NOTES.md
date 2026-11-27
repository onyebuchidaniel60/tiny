# Tiny — Design Notes

**Status:** 27 November 2026. Final product-polish pass implemented on native Android and web: shared design system, complete localization architecture, teacher/guardian tours, Help centre, open-source brand mark, responsive/dark/accessibility review and multi-language screenshots. Native-language review and physical-device/TalkBack verification remain operator/device gates.

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

### 3a. Browser companion

- Reuses the same paper/ink/forest/tomato/butter palette, serif display headings and original Tiny mark.
- Desktop uses a persistent sidebar, topbar connectivity/sync state and two-column work areas.
- Mobile uses a bottom navigation bar plus a topbar Settings shortcut; cards and forms stack to one column.
- Attendance uses large, labelled present/absent/late controls with text and color; status is never color-only.
- The guardian simulator is a phone-shaped, clearly labelled synthetic SMS surface with a persistent DEMO notice.
- Large-text and reduced-motion toggles are implemented and persist with the local workspace.
- Playwright axe scan on Home reports **0 serious or critical** WCAG 2 A/AA violations at desktop and mobile widths.
- Evidence: `artifacts/web/desktop-chromium-home.png`, `desktop-chromium-class.png`, `mobile-chromium-home.png`, `mobile-chromium-class.png`.

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
| 26 Nov 2026 | — | StageShow install interrupted by harness restart | Direct design-system discipline for the initial pass | Superseded 27 Nov: skill installed, read and applied | Build log/handoff |
| 26 Nov 2026 | — | First-launch seed race showed 0 classes/pending | Splash holds until encrypted seed completes; deterministic Home state | Avoid misleading demo data and stale Room observers | `TinyApplication.kt`, `MainActivity.kt` |
| 26 Nov 2026 | - | Bottom-nav semantics are merged | Stable `testTag` values for `tab_home`, `tab_classes`, `tab_lessons`, `tab_messages` | Reliable instrumentation without weakening accessibility labels | `TinyComponents.kt`, `TinyNavigationTest.kt` |
| 27 Nov 2026 | REF-001/REF-002 | Browser evaluation needs the same warmth without copying the landing page | Original responsive teacher workspace; sidebar on desktop, bottom navigation on mobile; explicit local/sync state | Preserve product identity; make offline/pending honest rather than decorative | `web/src/styles.css`, `artifacts/web/` |

## 8. Final polish pass — 27 November 2026

### StageShow

- Installed successfully with `npx skills add benjitaylor/skills --skill stageshow` (the skill ID appeared after the earlier server restart; the complete skill is present under `.agents/skills/stageshow/`).
- Read `SKILL.md`, `references/craft.md` and `references/review.md`.
- Applied its craft rules to the real product: count real strings, one focal action per screen, no skeleton bars where the eye lands, consistent icon family, no generic AI sparkle, no invented logo, measured insets and a frame reviewed at final viewport size.
- StageShow is a faux-UI/illustration skill; no faux product screen was shipped as the application. The screenshots are real renders.
- The AI cue changed from a sparkle to a lightbulb/idea path on web and an information icon on Android.

### Design references re-checked

- **Atelio Studio:** warm paper field, strong serif display type, human tone, restrained craft details, balanced colour. Tiny keeps its own palette, layouts and components; no Atelio asset, illustration, copy or source was copied.
- **PASS:** direct hero promise, problem → solution → features → how-it-works → CTA → substantial footer. Applied to the sign-in/product story and the existing landing structure, not copied.
- Findings and deviations are recorded in `REFERENCE_ASSETS.md` and `docs/DESIGN_SYSTEM.md`.

### Android

- Navigation: Home, Classes, Lessons, Messages plus detail routes; top bar now exposes Help and Settings.
- All screens use shared string resources: onboarding, auth, dashboard, classes, class detail, pupil registration, attendance, lessons/5E, progress/approvals, guardians/verification, messages/conversation, sync, settings, AI and Help.
- First-use teacher tour (10 steps) and guardian SMS guide (4 steps), skippable, persisted in DataStore, replayable.
- Help centre with searchable/expandable guides and tour replay.
- Language switching applies immediately, persists across restart and is exposed to Android 13+ per-app language settings.
- Dark theme follows the system; all components use Material colour roles where practical.
- App icon and wordmark use the Lucide sprout symbol; no letter-in-a-square invented mark.
- Removed the old “Demo/Preview/FIREBASE” labels from the main product surfaces; the evaluation disclosure remains where it is necessary.

### Web

- Every screen, dialog, validation message, toast, empty state, status, tour and Help article now uses `I18nProvider`; no page-level English literals remain.
- Language selector in the top bar and Settings; immediate re-render and reload persistence.
- Teacher tour, guardian guide, Help centre, search, language-aware dates and plurals.
- Dashboard rewritten as a task-focused teacher workspace: summary strip, today’s classes, family messages, quick actions, absence-only note.
- Responsive shell verified at 1440, 820 and 393 px; no horizontal overflow in any language.
- System dark-mode palette, focus-visible rings, skip link, dialog focus trap, reduced-motion and large-text controls.
- PWA assets remain small and dependency-light; no remote fonts or stock imagery.
- Hosted companion still reports local-only writes truthfully; no cross-device or live-SMS claim.

## 9. Known design/UX gaps

- Native-language review of Hausa, Yoruba and Igbo is still required; the translations are complete drafts, not verified by a native speaker.
- Real-device validation on the Note 10+ (Android 12), TalkBack and physical low-cost browser testing remain operator/device gates.
- Sync conflict/needs-attention UI is implemented and tested locally, but a hosted backend acknowledgement cannot be exercised under Spark/NGN 0.
- The static `landing/` page was not newly published; the hosted teacher app is the public web surface. No GitHub Pages URL is claimed.
- Browser companion AI is cloud-only in the tested environments; on-device Gemini Nano is not proven on the Note 10+ or emulator.
- Browser storage is synthetic-only and unencrypted; the Android app uses Room + SQLCipher.
- PWA stale-cache update prompting remains a future production concern.
- Android screenshots in `artifacts/emulator/` are regenerated by the manual emulator job; physical-device screenshots are not claimed.
