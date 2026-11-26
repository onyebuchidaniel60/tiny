# Tiny landing page

A static, dependency-free public landing page for the Tiny preview.

## Local preview

From the repository root:

```powershell
npx --yes serve landing
```

Open the printed local URL. The page also works by opening `landing/index.html` directly, though a local server is preferred for correct relative paths.

## Structure

- `index.html` — hero, problem, approach, teacher/parent features, how it works, constraints, walkthrough, impact, build status, FAQ, final CTA, footer.
- `privacy.html` — draft preview privacy notice.
- `security.html` — engineering security overview and outstanding gates.
- `contact.html` — public contact route.
- `styles.css` — original warm paper/riso-inspired visual system, responsive layout, reduced-motion support.
- `app.js` — mobile navigation, current year and optional scroll reveal. No analytics or tracking.

## Deployment

The `landing-pages` workflow is manual (`workflow_dispatch`) and publishes `landing/` to GitHub Pages after the repository owner enables Pages with “GitHub Actions” as the source. It was not enabled during the Phase 1 checkpoint, so no public preview URL is claimed. Use the local preview or a protected artifact until then.

## Content rules

- No fabricated testimonials, customer logos, partnerships, adoption numbers or impact statistics.
- Clearly separate implemented/preview functionality from planned or externally gated functionality.
- Use synthetic names and test numbers only.
- Do not add analytics, contact forms, cookies or third-party paid embeds without privacy review and explicit authorization.
- Do not copy Atelio or PASS source, illustrations, branding, copy or assets. The references are visual/structural direction only.
