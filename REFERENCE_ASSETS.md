# Tiny — Reference Assets Register

**Status:** Operator-supplied references received 26 November 2026. Both are **reference-only**; Tiny will create an original identity and assets. No generated or substitute reference has been authorized.

**Rule:** Never claim a missing reference exists. Record exact URLs, retrieval date, ownership/licence notes and intended use. Do not copy source code, proprietary illustrations, logos, text, assets or distinctive protected layouts.

## 1. Supplied references

| Asset ID | Exact URL | Source/owner | Intended use | Rights/usage | Status |
|---|---|---|---|---|---|
| REF-001 | https://www.framer.com/marketplace/templates/atelio-studio/ | Framer Marketplace listing for Atelio Studio by Mehmet Kırlangıç | Visual direction: warm human illustrative SaaS character, strong typography/hierarchy, bold balanced colour, hand-drawn details, playful accents, feature cards, responsive composition | **Reference only.** Listing indicates a limited licence. Do not copy source, illustrations, assets, copy, branding or implementation. Create original Tiny identity and assets | SUPPLIED — REFERENCE ONLY |
| REF-002 | https://pass-web-dun.vercel.app/ | PASS public landing page (operator-supplied reference) | Structural/storytelling direction: strong hero, problem/solution, feature sections, step-by-step walkthrough, embedded interface demonstrations, final CTA, substantial footer | **Reference only.** Do not copy copy, branding, layout code or proprietary assets. Use structure and storytelling principles only | SUPPLIED — REFERENCE ONLY |

Retrieved and inspected: 26 November 2026. Re-inspected as rendered pages on 27 November 2026; actual-page captures are `artifacts/screenshots/ref-atelio-render.png` and `artifacts/screenshots/ref-pass-render.png`.

### Rendered inspection notes (27 November 2026)

- **Atelio:** cream field, oversized near-black sans display type, a single cobalt primary action, outline secondary action, an asymmetric product specimen with a hard offset shadow, a yellow circular sticker and a quiet logo ticker. The warmth comes from colour and proportion, not gradients or decoration.
- **PASS:** near-black field, one hot accent, a large direct hero promise, a bordered product specimen on the right, numbered horizontal process steps, evidence labels and a long structured story. The product interface is presented as proof, not as a generic illustration.
- **Tiny adaptation:** warm paper and serif identity from Atelio; direct promise, specimen/card proof and numbered how-it-works rhythm from PASS. Tiny does not copy the trading content, dark palette, illustrations, assets, source or exact layout.

## 2. Inspection notes

### REF-001 — Atelio Studio visual direction

- Warm risograph-inspired personality: ink outlines, hand-drawn doodles, hard offset shadows, crafted/analog feel.
- Palette impression: cobalt blue, tomato/red, butter/cream, warm paper neutrals.
- Strong display typography and clear hierarchy; friendly rather than corporate.
- Product UI proof cards and feature cards embedded in the page.
- Playful accents and stickers used sparingly; responsive page structure.
- Tiny adaptation: use an original warm education palette, original hand-drawn SVG motifs, clear teacher/parent illustrations and Tiny-specific product UI cards. No copied Atelio illustrations, names, copy or components.

### REF-002 — PASS structural direction

- Hero with a direct promise, primary/secondary CTAs and an embedded product specimen.
- Explicit problem section with numbered evidence cards.
- Solution section with three clear pillars.
- Step-by-step "how it works" with a visible product journey.
- Feature grid with concise, load-bearing descriptions.
- Strong final CTA and a substantial footer with multiple legitimate links.
- Tiny adaptation: use this structural rhythm for Tiny's education story, but with Tiny's own content, product capabilities, visual identity and truthful implementation status. No fabricated metrics, testimonials or partnerships.

## 3. Tiny visual direction to implement

- Warm, trustworthy, modern and human.
- Distinctive without being childish; suitable for teachers, parents, schools and institutional partners.
- Strong typography, generous spacing, clear hierarchy, responsive layouts.
- Original hand-drawn accents and illustrations with an education/community feel.
- Accessible contrast, readable type, 48dp-equivalent web touch targets, keyboard/focus support and reduced-motion support.
- No heavy media, autoplay video or large assets that undermine low-bandwidth goals.
- The Android app remains optimized for low-end devices; landing-page visual effects must not compromise its performance.

## 4. Screens to implement from reference principles

1. Teacher dashboard / workspace switcher.
2. Class list and class overview.
3. Attendance register and submission review.
4. Lesson planner and 5E lesson view.
5. Pupil/guardian record and progress entry.
6. Parent communication inbox and conversation.
7. Settings: language, sync, data use and account.
8. Workspace administration and teacher memberships (role-gated).

## 5. Landing-page structure to implement

1. Hero and primary calls to action.
2. Problem Tiny addresses.
3. Tiny's approach.
4. Teacher features.
5. Parent features.
6. How Tiny works.
7. Offline-first, low-bandwidth and multilingual design.
8. Product walkthrough and interface demonstrations.
9. Potential educational impact without fabricated statistics or claims.
10. Frequently asked questions.
11. Final call to action.
12. Complete footer with legitimate links.

The landing page must distinguish planned MVP functionality from implemented/preview functionality. It is a separate public-facing experience, not the Android product frontend.

## 6. Inspection record for Phase 1/6 refinement

- Initial visual extraction: warm paper/riso personality, serif display type, hard ink outlines, offset shadows, tomato/cobalt/butter accents, hand-drawn doodles, embedded product mockups.
- Initial structure extraction: hero → problem → approach → teacher/parent features → how it works → constraints → walkthrough → impact → build status → FAQ → final CTA → substantial footer.
- Landing page implemented in `landing/` with original copy, SVG/CSS motifs and original product mockups.
- Screenshot evidence: `artifacts/screenshots/landing-desktop-full.png`, `landing-mobile-top.png`, `landing-mobile-revealed.png`.
- **StageShow (27 November 2026):** installed successfully with `npx skills add benjitaylor/skills --skill stageshow`. The complete skill is present under `.agents/skills/stageshow/`; `SKILL.md`, `references/craft.md` and `references/review.md` were read. Its restraint, focal-object, typography, icon-family, spacing and viewport-review rules were applied to the real Android and web interfaces. No faux-UI asset was shipped as the app. The earlier failed attempt was a harness restart issue, not a licence or installation refusal.
- **Final typography:** system serif display (`Iowan Old Style`/`Palatino`/`Georgia`; `FontFamily.Serif` on Android) and system sans body (`Segoe UI Variable Text`/`system-ui`; `FontFamily.SansSerif` on Android). No remote fonts; full system font-scaling support.
- **Final colour tokens:** paper `#F7F1E5`, surface `#FFFDF8`, ink `#1C2A24`, ink-soft `#56635B`, forest `#1D5B47`, tomato `#CF5A3C`, cobalt `#2B5AA0`, butter `#EFC35A`, line `#D8CAB2`; semantic success/error/waiting tokens and a deep-green-charcoal dark scheme. Contrast checked for text/actions and status text; status is never colour-only.
- **Illustration/asset inventory and ownership:** no third-party illustrations or photography. The mark is Lucide `sprout` (ISC, v0.544.0), recorded in `docs/BRAND_AND_ASSETS.md`. The wordmark is typographic. Synthetic screenshots are Tiny-owned renders.
- **Responsive breakpoints tested:** web desktop 1440 × 1000, tablet 820 × 1180, mobile Pixel 5 393 × 851; sidebar→bottom navigation at 820 px; two-column→one-column at 1120 px; class rows wrap at 560 px. No horizontal overflow in any language.
- **Accessibility checks:** skip link, focus-visible rings, dialog focus trap/Escape/arrow keys, 44–48 px targets, semantic labels, `aria-live` results, `role=alert/status`, large-text and reduced-motion controls, axe Home scan (0 serious/critical), Android Material semantics and 48 dp targets. TalkBack/physical-device pass remains pending.
- **Intentional deviations from REF-001/REF-002:** Tiny does not reproduce Atelio's limited-licence illustrations, cobalt/tomato/butter exact palette, or PASS's trading-specific content/layout; it uses the structural storytelling rhythm and a warm education identity with original components. The Android app uses Material navigation conventions rather than copying a web template. StageShow's “one big number” rule was relaxed for the teacher summary strip because four equal, scannable facts are more useful in a dashboard; hierarchy remains on the primary action.
- **Performance notes:** no remote fonts, stock media or video; web production JS ~1.17 MB raw / ~351 kB gzip including Firebase, CSS ~36 kB / 7.4 kB gzip; PWA precache ~1.19 MB. Android APK remains debug-preview sized; no new image assets beyond the small vector mark. Emulator/profile captures are from a Pixel 5 API 35 profile.

## 7. Generated-reference authorization

Default: **not authorized**. The operator supplied REF-001 and REF-002 and instructed that they be used; no generated replacement reference is authorized. If generation is later approved, record the exact authorization, prompt, generated file path and date here, and treat it as generated—not operator-supplied.
