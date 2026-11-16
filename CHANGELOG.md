# Changelog

Each release is archived on Zenodo with its own version DOI. The concept DOI,
[10.5281/zenodo.22751439](https://doi.org/10.5281/zenodo.22751439), always
resolves to the newest version. The full notes for each release are on the
[releases page](https://github.com/arch85-km/construction-studio/releases).

## Unreleased

- **Fixed** — columns, pads and piles are sized for the load the Load path
  card shows. They counted the roof as another floor (A × storeys × w), so
  the office template's B2 column was sized for 2475 kN against the card's
  2138 kN, and the portal shed's pads for 1050 kN against 375 kN. The rule
  is now A × (w_roof + (storeys − 1) × w), the takedown's own sum; the
  method notes' tall-column table is re-measured with it.
- **Fixed** — the card's "Worst column" line printed "56.25 m² × 4 levels
  = 2138 kN", which does not multiply out; it now shows the sum,
  "56.25 m² × (5 + 3 × 11) kN/m² = 2138 kN".
- **Fixed** — the load-path diagram stays with an exploded or opened model
  instead of being drawn where the building would be at rest.
- **Fixed** — strip footings are sized for the takedown's load per metre.
  They used a fixed 12 kN/m per storey whatever the use class, so the
  timber house's footing read 24 kN/m against the card's 31.4, and the
  masonry house's 36 against 55.2. The formula line now shows the sum,
  "1129 kN ÷ 36.0 m = 31.4 kN/m ÷ 150 kPa = 0.45 m wide strip".
- **Fixed** — a level carried by a panel alone, every level of the
  Concrete flat slab and the Mass timber roof, now shows its load travelling
  sideways. Panels were not counted as spanning members, so the load went
  from the floor straight into the columns and the Horizontal filter showed
  nothing. The panel is read as strips running the way its system spans:
  both ways to the column lines for a two-way slab, across the short
  direction for a one-way panel. Each level still delivers exactly its load.
- **Fixed** — the load path's wall bands and column sleeves sit on their own
  walls and columns. The explode moved them toward the plan's origin, even
  at rest: the house bands lay up to 3 m from their walls, and the office's
  16 sleeves sat on one spot.
- **Tests** — `npm test` runs the release check and a load-takedown suite
  (`tests/loads.test.mjs`) over every template and use class.
- **Docs** — the method notes, README, ARCHITECTURE.md and code comments no
  longer describe test suites the repository does not hold. They name
  `npm test` and say which checks were run only during development.
  Comments naming a design check, a
  `DESIGN` module, `FEM.sectionToLocal()` and "Benchmark 11/12", none of
  which exist, are corrected, and an unused copy of `memberMatrix` that
  called the missing `FEM` is removed.
- **Changed** — every size and load the app shows is marked as a teaching
  estimate, not for construction: on the sizing cards, "Why this size", the
  load path, About, the PNG title block (or the image itself when the title
  block is off), and the CSV.
- **Changed** — the green sizing chip reads "span OK" instead of "OK", which
  says what was judged rather than reading as an approval.
- **Changed** — the cube device, the icon and logo, is reserved: neither the
  MIT licence nor CC BY 4.0 grants any right to use it.
- **Fixed** — the licence statements no longer name exercises or a reference
  page that no longer exist.
- **Fixed** — the release guard read only unquoted DOI values in
  `CITATION.cff`.
- **Changed** — the release guard also checks the app's own version and
  date stamps, the README's citation, and each notes byline's date and BibTeX
  version: 18 checks.
- **Docs** — `ARCHITECTURE.md`, `CHANGELOG.md` and `DESIGN.md` added, and a
  statement of how the app is developed added to the README, the method
  notes and a new `.zenodo.json`.

## [1.1.0](https://github.com/arch85-km/construction-studio/releases/tag/v1.1.0) — 4 October 2026

Version DOI [10.5281/zenodo.23142910](https://doi.org/10.5281/zenodo.23142910).
What the tool models is unchanged: there is still no structural analysis.

- **Changed** — three.js r185 is bundled into the file instead of loaded from
  a CDN, so the app fetches nothing and runs with no network connection. The
  file grows from 0.4 MB to 1.5 MB, and three.js's notice travels with it.
- **Changed** — the boot screen names what can still stop the 3D engine: a
  content-security policy, a browser without WebGL, or one older than about
  2021.
- **Added** — "© Karam Al-Obaidi" in the corner opens About & sources: what
  the tool is and does not do, the credits, the licence and how to cite it.
- **Fixed** — the method notes and the README cited 1.0.1's version DOI under
  1.1.0. They now give the concept DOI.
- **Docs** — the third-party notice no longer describes the removed import
  map.
- **Added** — `tools/check-release-metadata.mjs` checks that the version and
  the DOI agree across the metadata and both method notes.

## [1.0.1](https://github.com/arch85-km/construction-studio/releases/tag/v1.0.1) — 14 September 2026

Version DOI [10.5281/zenodo.22751440](https://doi.org/10.5281/zenodo.22751440).
Documentation and metadata only; no change to the application.

- **Docs** — the method notes gain the full fifteen-material library and four
  sections recovered from the retired reference page: assemblies come from
  presets only, what per-element editing permits, what can be changed about a
  layer, and Building Regulations compliance. The references become a proper
  list, and both the notes and the app show when they were last updated.
- **Docs** — `CITATION.cff` gains an ORCID and a repository-code field.

## [1.0.0](https://github.com/arch85-km/construction-studio/releases/tag/v1.0.0) — 14 September 2026

First public release. Not archived on Zenodo; the archive starts at 1.0.1.

- A parametric model of a building's construction: choose a foundation,
  ground floor, wall or frame, floor and roof, and the building assembles
  itself on a grid.
- Members sized from preliminary-design span rules of thumb, with the
  arithmetic kept on screen.
- Explode, cut open, step through in build order, and compare against an
  alternative side by side.
- No structural analysis, deliberately: no solver, no internal forces, no
  strength or deflection check.
- One self-contained HTML file, no build step, built with three.js.
