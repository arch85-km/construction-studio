# Changelog

Each release is archived on Zenodo with its own version DOI. The concept DOI,
[10.5281/zenodo.22751439](https://doi.org/10.5281/zenodo.22751439), always
resolves to the newest version. The full notes for each release are on the
[releases page](https://github.com/arch85-km/construction-studio/releases).

## Unreleased

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
