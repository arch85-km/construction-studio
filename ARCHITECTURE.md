# Architecture

How Construction Studio is put together: what lives where, how four choices
and a grid become a building, and what the tooling around it does. For what
is and is not modelled, and how exact the sizes are, read the
[method notes](construction-studio-method-notes.html). This file is the map.

## One file

`construction-studio.html` is the application and the deliverable. Nothing
builds it: it is edited directly, and the copy in the repository is the copy
uploaded to the website. It runs with no network connection. three.js is
bundled inside it, and there is no web font or icon set to fetch.

| Part | Size | What it holds |
|---|---|---|
| Header comment | 5 KB | The licence, how to cite it and the third-party notice |
| three.js r185 | 1.09 MB | Bundled and minified, with its `@license` headers. It is exposed as `globalThis.THREE`. |
| `<style>` | 39 KB | All styling |
| Markup and boot guard | 6 KB | The interface. A small classic script (`window.__csBooted`) explains on the boot screen what stopped the 3D engine if the app never starts. |
| The application | 400 KB | One `<script type="module">`, about 8,500 lines, not minified |
| **Total** | **1.56 MB** | |

## Conventions

- Units are metres. Plan geometry uses `[x, z]` pairs, with Y up.
- Section properties are stored in SI and formatted by `U` (`fx`, `sig`,
  `eng`).
- The release is written into the file in several places: the header
  citation, `app:'1.1.0'` in the saved document, and the About panel's
  "Version X · updated d Month yyyy" and its citation. The release guard reads
  the app's copy.
- Every size and load the app shows carries one caution,
  `NOT_FOR_CONSTRUCTION` ("Teaching estimate from a rule of thumb — not for
  construction."). Its longer form, `NOT_FOR_CONSTRUCTION_FULL`, appears on
  the sizing cards, "Why this size", the load path, About, the PNG title block
  and the CSV export.

## The application

Its sections are numbered in the source; search for the heading.

| Section | What it does |
|---|---|
| 1–3, 7, 8 `U`, `Util`, `GEOM` | Units, helpers, an event bus and a 2D polygon toolkit for slabs, takedown and drafting |
| 2 Member axes | Orientation of a member from its two ends |
| 3 `LIB` | The material library (fifteen materials) and the steel, concrete and timber sections |
| 4 `SIZING` | 27 preliminary-design rules of thumb, such as span ÷ 19 for a steel beam. Each one writes its arithmetic out (`fmt`), so the student sees "7.5 m ÷ 23.5 = 319 mm → IPE 330" rather than an answer. |
| 5 Build-ups | The layer stack of each assembly, outermost first. The same array draws the 3D wall and the 2D layer diagram. |
| 6 `Model` | The document: four choices and a grid. Serialised to `.building.json`. |
| 7 `Store` | The document, the selection, and undo as whole-document snapshots |
| 8 `SYSTEMS` | The catalogue: 30 systems across foundation (4), ground floor (4), walls and structure (9), floor (7) and roof (6) |
| 8b Connections | Junctions derived from the pair of materials that meet, never chosen. Each carries a sentence on what the joint has to do. |
| 9 `Gen` | Parameters in, plans out. Vertical systems run first and register their supports, floors and roofs read them, and foundations run last. Plain data, no three.js, so it re-runs on every slider drag. |
| 11b `Loads` | A gravity takedown by tributary area, with no frame action and no analysis. Its invariant is that the loads on all supports add up to the loads on all floors. |
| 10 `Render`, 11 `Realize` | One renderer and one scene, drawn on demand. Repeating parts are merged into one geometry per part, level, role and material, not instanced, and keep a triangle-range table so a single stud can still be picked. |
| 12 `View` | Explode (along Y only, layer by layer), display styles, layers and the section box. View state saves with the file but stays out of undo. |
| 13 UI | DOM helpers, widgets, modals, toasts and the CSV writer |
| 14 `IO` | Save and open, autosave, preferences and downloads |
| 15 `Draft` | PNG export: the canvas at 2×, then the labels, title block and credit line redrawn over it |
| 16 `Import` | DXF plans (`LINE` and `LWPOLYLINE`, by layer), an OBJ of the context, and image underlays. Each can be placed, rotated and scaled. |
| 17 `Tour` | The guided tour, on every launch unless the student turns it off. `?tour=1` forces it. |
| 18 Dock, 19 Layer diagram | The four part cards and the property sheet, and the build-up drawing |
| 20 `Seq` | Build order, derived by level, then layer, then role rank, and played back |
| 21 `Compare` | Two systems on the same grid: two scenes and one shared camera, split by scissor |
| 19b Load path | The takedown drawn: a sleeve per column storey that grows with the load, arrows along each member, and the horizontal thrust at the foot of an inclined member |
| 22 `Pick` | A raycast resolved back through the merged batches to one member |
| 23 `App`, 24 `Build`, 25 `Ribbon`, 26 `boot` | Commands and wiring, grid lines and level datums, the five ribbon tabs, and startup |

## From four choices to a building

1. The document holds a grid (bays, spans, storeys) and one system for each
   of the four parts.
2. `Gen` runs the systems in a fixed order and emits plans: plain data, in
   which a repeating group such as 216 studs is a single plan.
3. `SIZING` gives each member its depth from its span, and `Connections`
   reads the junctions off the plans.
4. `Realize` turns the plans into merged geometry by layer, and `Render`
   draws the scene when something changes.
5. `Loads` runs the takedown, the load path draws it, and the sizing cards
   and "Why this size" show the arithmetic with the caution.

## Files the user brings and takes

- **Brings:** a saved `.building.json`, a DXF plan, an OBJ of the context, or
  an image to trace. All are read locally with `FileReader`; nothing is
  uploaded.
- **Takes:** the `.building.json`, a PNG with labels and a title block, and
  CSV tables.

## What the browser stores

Two `localStorage` keys:

- `construction-studio:autosave`: the current building. Underlays are stored
  without their image data, and are dropped first if the quota runs out.
- `construction-studio:prefs`: the theme, the view settings, and whether the
  tour opens on launch.

## The repository

```
construction-studio.html                    the application (the deliverable)
construction-studio-method-notes.html       method notes (Elementor HTML widget)
construction-studio-method-notes-summary.html  the method in brief
README.md                                   what it is, the systems, the sizing rules, how to cite
CITATION.cff                                citation metadata: version, date, concept and version DOIs
.zenodo.json                                the metadata Zenodo archives each release with
LICENSE · DOCS-LICENCE.md · NOTICE          MIT for code, CC BY 4.0 for material, three.js's notice
tools/check-release-metadata.mjs            the release guard
ARCHITECTURE.md · CHANGELOG.md · DESIGN.md
```

`.zenodo.json` holds the metadata Zenodo uses for each archived release,
including the licence notes and how the app was developed. Zenodo reads it in
preference to `CITATION.cff`, so the guard checks that its version agrees.

## Testing and release

`node tools/check-release-metadata.mjs` is the release guard. It runs 18
checks that the version, the date and the DOI agree everywhere they are
written: `CITATION.cff` and `.zenodo.json`; the app's saved-document stamp, its
About panel and its citations; the README's citation; and each method-notes
page's byline and BibTeX.
Until Zenodo mints a release's version DOI, the notes must cite the concept
DOI; the guard derives that rule from `CITATION.cff`.

The README's "Verified" section describes the checks run on the app during
development: sizing against hand calculation, a generator sweep, and the app
driven in Chromium. Those harnesses are not in the repository. Two code
comments still refer to them: "The test suite asserts it" in `Loads`, and
"what the verification harness uses" in `Draft`.

Release order: bump every stamp, run the guard, push, cut the GitHub
release (tag `vX.Y.Z`), then record the version DOI Zenodo mints in a
separate commit.

One stale statement in the README: "Roughly 8,300 lines in one file.
Nothing is minified" predates the bundled, minified three.js. (The 1.1.0
release notes named a `.zenodo.json` the repository did not then have; it
was added afterwards.)
