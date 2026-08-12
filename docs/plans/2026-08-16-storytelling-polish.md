# Storytelling Polish

## Direction

Peanup remains a paper-white editorial product story. The physical object and
the e-paper stage carry the visual weight; supporting UI stays quiet, precise,
and readable. New work should improve comprehension or interaction before it
adds another section.

## Current decisions

- The mobile hero specification rail uses a three-column grid so the five
  confirmed facts remain legible without horizontal scrolling.
- The iOS phone study uses one locale dictionary for its in-screen labels.
  The frame, status strip, and app views keep their measured proportions.
- The exact transparent phone frame remains the source of truth. A small
  preview image is shown until the full frame decodes, then the handoff is
  announced through `aria-busy` without changing layout.
- The four e-paper scenes keep their existing canvas animation, fallback first
  frame, scroll-driven writes, and reduced-motion behavior.
- Documentation keeps the shared shell, product-page entry, bilingual Docs,
  sticky desktop outline, and touch-friendly mobile navigation.

## Acceptance checks

- No horizontal overflow at 360px, 390px, iPad widths, or 1920px ultrawide.
- Mobile hero facts remain readable and wrap inside their cells.
- All six product locales render localized phone labels.
- Phone frame and status assets preserve their measured aspect ratios and the
  fallback never leaves an empty cold-load region.
- `pnpm build`, `git diff --check`, route verification, and browser screenshots
  pass before release.
