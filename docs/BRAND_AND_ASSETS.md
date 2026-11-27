# Tiny — Brand and Asset Register

**Status:** 27 November 2026. Tiny uses an existing open-source symbol, not an original logo.

## 1. Selected symbol

| Item | Record |
|---|---|
| Symbol | **Sprout** |
| Library | **Lucide** (`lucide-static`) |
| Version inspected | `0.544.0` (27 November 2026) |
| Source | <https://lucide.dev/icons/sprout> and <https://unpkg.com/lucide-static@0.544.0/icons/sprout.svg> |
| Licence | **ISC** |
| Rights note | Permits use, copy, modify and distribution with copyright/permission notice. Tiny does not claim the symbol as an original Tiny logo. |
| Tiny role | Product mark inside a warm circular field, paired with the typographic wordmark “Tiny” |

The ISC permission notice is reproduced in the Lucide package (`LICENSE`, `NOTICE.md`) installed under `.agents/skills/stageshow/` and in the upstream repository. The symbol is used unmodified as a line icon; the circular field is a Tiny presentation treatment, not a new claim of authorship over the symbol.

## 2. Usage

### Web

- `web/src/components/TinyMark.tsx` renders the Lucide sprout path as an inline SVG.
- `web/public/tiny-mark.svg` is the favicon/PWA icon: cream field, forest circle, paper sprout.
- The wordmark is set in the product serif; no image wordmark is used.

### Android

- `app/src/main/res/drawable/ic_tiny_mark.xml` is the in-app vector.
- `app/src/main/res/drawable/ic_launcher_foreground.xml` is the adaptive-icon foreground: forest circle with the paper sprout on the cream launcher background.
- `TinyWordmark` pairs the symbol with the localized tagline.

## 3. Colour variants

| Variant | Field | Sprout | Used |
|---|---|---|---|
| Default | Forest `#1D5B47` | Paper `#F8F1E2` | App bar, sign-in, launcher |
| Inverse | Paper `#F8F1E2` | Forest `#1D5B47` | Dark/contrast contexts if needed |
| Monochrome | Current text colour | — | Not currently shipped |

The adaptive icon uses a safe-zone-scaled 108 dp vector. No text is baked into the launcher icon.

## 4. Typography

The wordmark is typographic only. Display type uses the platform serif stack; body uses the platform sans stack. No remote font is downloaded, which protects offline and low-bandwidth use. The Android app uses the system serif/sans families through Compose `FontFamily.Serif` and `FontFamily.SansSerif`.

## 5. Asset ownership

- All photography, illustrations and screenshots in `artifacts/` are captured from Tiny's own synthetic workspace.
- No Atelio Studio, PASS, Framer, school, guardian or pupil asset is copied.
- Synthetic names and numbers are sample data, not real people.
- Icon library attribution: Lucide, ISC. Firebase, Firebase AI Logic and Gemini are trademarks of Google; Tiny does not claim ownership of those marks.
