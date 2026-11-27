# Tiny — Design System

**Status:** 27 November 2026. Applied to the web application and native Android app.

## 1. Principles

1. **Warm, human, credible.** An education product, not an enterprise dashboard and not a generic AI SaaS page.
2. **Quiet hierarchy.** One clear primary action per screen. Space and type carry the hierarchy; boxes and gradients do not.
3. **Offline is visible, not alarming.** Sync and connection states are honest, plain-language and never imply a delivery or server acknowledgement that did not happen.
4. **Teacher-first density.** Attendance is a fast thumb workflow; lessons and help are comfortable reading surfaces.
5. **No invented logo or decorative AI magic.** The mark is Lucide's open-source sprout. AI uses a lightbulb/idea cue, not a sparkle.
6. **Low requirements.** System fonts, no remote assets, no autoplay video, small DOM, one PWA shell.

## 2. Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| Paper | `#F7F1E5` | `#111A16` | App background |
| Surface | `#FFFDF8` | `#1A2721` | Cards, inputs |
| Paper 2 | `#FBF7EE` | `#16211B` | Sidebar, soft cards |
| Ink | `#1C2A24` | `#F2ECDC` | Primary text |
| Ink soft | `#56635B` | `#B8C4BA` | Secondary text |
| Forest | `#1D5B47` | `#2F725A` | Primary action, identity |
| Tomato | `#CF5A3C` | `#E17A5E` | Attention, absence, destructive |
| Cobalt | `#2B5AA0` | `#82A9DD` | Information, links |
| Butter | `#EFC35A` | `#E7C675` | Waiting, highlights |
| Line | `#D8CAB2` | `#384A3F` | Borders |
| Success | `#2A7857` | `#7CC7A3` | Submitted/present/synced |
| Error | `#B4422C` | `#F08A72` | Validation failure |

Android maps the same core palette through `MaterialTheme.colorScheme` and `Tiny*` tokens in `ui/theme/Color.kt`.

## 3. Typography

- **Display/headings:** platform serif (`Iowan Old Style`/`Palatino`/`Georgia` on web; `FontFamily.Serif` on Android). Weight 700. Tight tracking, generous line height.
- **Body/UI:** platform sans (`Segoe UI Variable Text`/system-ui on web; `FontFamily.SansSerif` on Android).
- **Scale:** 11–15 px UI labels, 16–18 px body, 24–44 px page headings, one large display line on entry screens. Android uses the Compose typography scale; text respects system font scaling.
- **Case:** sentence case for controls and body. Uppercase only for small eyebrow labels. No all-caps buttons.
- **No remote fonts.** This is a low-bandwidth/offline requirement.

## 4. Spacing, radius and elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56.
- Page gutter: 14 px mobile, 34 px desktop.
- Card padding: 16–22 px.
- Radii: 10–12 px controls, 15–18 px cards, 22–24 px dialogs/phone frames, 999 px pills.
- Borders: 1 px semantic line. Elevation is a soft 3–10 px shadow, never a heavy drop shadow.
- Touch targets: minimum 44 px web, 48 dp Android.
- No translucent overlapping cards; no decorative plate behind primary surfaces.

## 5. Layout

- Web shell: 256 px sidebar, sticky 1 px topbar, content max 1320 px, app footer.
- Detail pages max 1120 px.
- Desktop: two-column work areas; wide-left where the form is primary.
- Tablet: one column below 1120 px; the sidebar remains until 820 px.
- Mobile: bottom navigation (Home, Classes, Lessons, Messages, Guardians), topbar with help/settings, stacked cards and forms.
- No horizontal overflow at 390 px, 820 px or 1440 px; verified by Playwright.
- Android: `LazyColumn`, 20 dp gutters, stacked cards, bottom navigation on main routes, top app bar with back/help/settings.

## 6. Surfaces and components

- **Cards:** surface + 1 px line + soft shadow; `soft-card` for secondary explanation.
- **Primary button:** forest fill, paper text, 44–52 px height.
- **Secondary:** surface fill with line border.
- **Ghost:** text/forest, no border.
- **Danger:** tomato-soft, ink text.
- **Pills:** semantic tone with text, never colour alone.
- **Fields:** 44 px minimum, visible label above, hint below, inline error in a bordered soft surface with `role="alert"`.
- **Lists:** one shared row pattern; avatar/date + two-line main + trailing state.
- **Empty states:** icon, short title, one explanatory sentence and an optional action.
- **Toasts:** dark ink surface, status role, dismiss button.
- **Sync/status:** icon + text + colour; pending/waiting states use butter, conflicts use tomato.

## 7. Iconography

- Android uses Material Icons (core) at 19–24 dp, one outlined family.
- Web uses a single 24 px, 1.8 px stroke inline line set in `Icon.tsx`, plus the Lucide sprout brand symbol.
- AI/teaching support uses a lightbulb/idea path, not a sparkle.
- Icons never carry meaning alone: every status has a text label.

## 8. States

Every screen has explicit:
- **Loading:** splash/opening workspace, spinner in auth.
- **Empty:** no classes/pupils/lessons/messages/observations.
- **Success:** inline success surface or status snackbar.
- **Error:** inline error with `role="alert"` and a retry path.
- **Offline:** banner with plain-language explanation; local edits remain.
- **Pending/queued:** text status and sync centre; never shown as synced until acknowledgement.
- **Conflict/rejected:** visible status; not silently overwritten.
- **Permission/not found:** explicit record-specific empty state.
- **Reduced motion / large text:** persisted web preferences; system settings on Android.

## 9. Accessibility

- Semantic landmarks, skip link on web.
- Visible `:focus-visible` rings with 3 px outline.
- Dialog focus trap, Escape, arrow-key tour navigation and focus return.
- 44–48 px touch targets.
- Text and icon labels for all state; never colour-only.
- `aria-live` for generated AI result and tour step; `role="status"` for success; `role="alert"` for errors.
- No reliance on hover.
- Large text and reduced motion controls.
- Axe scan on Home and functional pages: 0 serious/critical violations at tested widths.

## 10. StageShow application

StageShow was installed successfully on 27 November 2026. Its craft rules were applied as a review discipline to the **real** product interfaces:

- Count real strings; remove decorative filler and repeated framing.
- One focal action and one dominant surface per screen.
- Real content on the area the story is about; quiet space at the edges.
- Use a purposeful icon set; no hand-drawn chrome, no invented logo, no generic AI sparkle.
- Consistent gutters, insets and row pitch; fit text before widening containers.
- Check the frame at the size it will be seen (desktop, tablet, phone), not just the code.
- A light pass does not prove dark: web supports `prefers-color-scheme`; Android uses the Material dark scheme.

StageShow is an illustration/faux-UI skill; no invented faux product UI was shipped as if it were the app. The shipped screenshots are of the working applications.

## 11. Design references

- **REF-001 Atelio Studio:** warm paper/riso character, serif display type, human tone, crafted details and restrained decorative marks. Tiny uses an original palette and original components; no assets, copy or layouts copied.
- **REF-002 PASS:** long-form product storytelling, direct hero promise, problem → solution → features → how-it-works → CTA → substantial footer. Applied to the product story and sign-in composition, not copied.

See `docs/DESIGN_NOTES.md`, `REFERENCE_ASSETS.md` and `docs/BRAND_AND_ASSETS.md`.
