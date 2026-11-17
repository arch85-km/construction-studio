# Changelog

Each release is archived on Zenodo with its own version DOI. The concept DOI,
[10.5281/zenodo.22751439](https://doi.org/10.5281/zenodo.22751439), always
resolves to the newest version. The full notes for each release are on the
[releases page](https://github.com/arch85-km/construction-studio/releases).

## [1.2.0](https://github.com/arch85-km/construction-studio/releases/tag/v1.2.0) — 17 November 2026

Version DOI to come: one is minted when this release is archived.
The loads, the load path and the sizes they drive are reworked, so figures
from 1.1.0 change. Before → after, on the templates: timber house 1129 →
468 kN to the ground; masonry house 2120 → 2094 kN; steel office 19 238 →
13 195 kN, its worst column B2 2475 → 1373 kN (HEB 280 → HEB 220);
concrete flat slab 19 129 → 22 379 kN; mass timber 6912 → 4303 kN.

- **Changed** — loads depend on what the building is made of. Each level's
  kN/m² was one number per use (residential 9, office 11, roof 5), whatever
  the construction, which put a timber house at about three times its
  weight. A level's load is now its floor or roof system's own weight
  (0.6 kN/m² for timber joists to 7.5 for an RC flat slab), plus 0.8 kN/m²
  of partitions on a floor, plus the imposed load for the use from
  EN 1991-1-1 (residential 1.5, office 2.5, retail 4.0, industrial 7.5,
  roof 0.6). The Load path card takes each figure apart, and a per-level
  change of floor system is counted.
- **Changed** — the walls' own weight is counted. Each storey of wall adds
  its weight per m² of face times the storey height, as kN per metre run:
  4.35 kN/m² for cavity masonry (following the leaf thicknesses), 6.4 for
  RC walls, 0.85 for CLT, 0.5 for a timber frame. On a frame the cladding
  (0.3–0.85 kN/m²) hangs on the edge columns, and is left out when "Show
  cladding" is off. The masonry house's footing carries 54.5 kN/m, its
  walls weighing twice its floors.
- **Fixed** — columns and footings are sized for the load the Load path
  card shows. They counted the roof as another floor, so the office's B2
  was sized for 2475 kN against the card's 2138, strip footings used a
  fixed 12 kN/m per storey, and a raft never saw the load. Every column,
  pad, pile cap, strip and raft now takes the takedown's own sum of the
  levels and walls it carries, and prints it: "56.25 m² × (1.6 + 3 × 7.6)
  kN/m² = 1373 kN".
- **Fixed** — load travels along the members as a chain. It was shared
  among every member as if they lay side by side, so a primary beam took a
  strip of its own besides the secondaries on it and a portal rafter
  carried 9 kN. The floor now rests on the members nothing else rests on,
  and each hands its load to what holds it up by tributary length and the
  lever rule: on the office a secondary at 2.5 m carries 142.5 kN and an
  interior primary the 285 kN of the secondaries on it; a shed rafter
  carries 82.5 kN, all to its foot. A flat slab or a CLT roof, carried by
  a panel alone, now shows its load travelling to the columns or walls
  too; a truss tie and a ridge board carry none.
- **Fixed** — the eaves thrust is worked from the roof's own load and says
  where the push goes. H = V / tan(pitch) was applied to every sloping
  member and drawn pushing the walls apart. It is now the three-pinned
  H = w s L² ÷ 8h: a truss's tie takes it as tension (3.8 kN per truss on
  the timber house) and the walls feel nothing; an untied cut roof pushes
  its walls (5.3 kN per metre on the masonry house) or, on a frame, its
  eaves; a portal frame pushes out at each base (62 kN on the shed).
- **Fixed** — the load path ends at the foundation chosen. The card always
  gave the strip-footing answer, even on a raft. It now shows a strip's
  line load and width, a raft's ground pressure against the soil (masonry
  house on a raft: 2094 kN ÷ 104.0 m² = 20.1 kPa on 150 kPa), or the
  heaviest pad or pile cap. A raft checks that pressure, so it can turn
  amber or red. The diagram draws a plate under every footing, coloured by
  how hard the ground works there.
- **Fixed** — the load-path diagram stays on the building when it is
  exploded or opened: wall bands, column sleeves and labels were drawn
  where the building would be at rest, or pulled toward the plan's origin.
- **Fixed** — the card's "Worst column" line multiplies out. It printed
  "56.25 m² × 4 levels = 2138 kN".
- **Fixed** — pads under a wall building, which Gen warns against, no
  longer read "NaN": the four corner pads share the whole building.
- **Fixed** — a building saved by 1.1.0 with Use "Roof", which that version
  offered by mistake, opens as Office and says so, instead of loading as a
  use it no longer has. The Use list no longer offers "Roof".
- **Added** — Loads CSV and Sizes CSV on the Analysis tab: the takedown
  level by level, and every sized element with its rule, load, section and
  working, each headed by the not-for-construction caution.
- **Changed** — every size and load the app shows is marked as a teaching
  estimate, not for construction: on the sizing cards, "Why this size", the
  load path, About, the PNG title block (or the image itself when the title
  block is off), and both CSV exports.
- **Changed** — the green sizing chip reads "span OK" instead of "OK", which
  says what was judged rather than reading as an approval.
- **Changed** — the cube device, the icon and logo, is reserved: neither the
  MIT licence nor CC BY 4.0 grants any right to use it.
- **Tests** — `npm test` runs the release guard and `tests/loads.test.mjs`,
  which drives the app in headless Chromium over every template and use
  class: the documented loads, both takedown invariants, the member chain
  and roof spread against hand calculation, each foundation, the card's
  figures, the diagram's placement and the CSV exports.
- **Fixed** — the release guard read only unquoted DOI values in
  `CITATION.cff`.
- **Changed** — the release guard also checks the app's own version and
  date stamps, the README's citation, and each notes byline's date and BibTeX
  version: 18 checks.
- **Docs** — the method notes describe the new loads, the member chain, the
  roof spread and the foundation step, re-measure the tall-column table
  (the steel catalogue now runs out at twelve storeys, not eight) and cite
  EN 1991-1-1. They, the README and ARCHITECTURE.md no longer describe test
  suites the repository does not hold, and code comments naming a design
  check, `FEM` and "Benchmark 11/12", none of which exist, are corrected.
- **Fixed** — the licence statements no longer name exercises or a reference
  page that no longer exist.
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
