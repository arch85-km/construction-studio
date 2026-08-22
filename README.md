# Construction Studio

Build and visualise construction systems in timber, concrete, steel and masonry.
One self-contained HTML file, no build step, no server, no backend.

**© Karam Al-Obaidi**

---

## What it is

Architecture students learn construction from drawings — a wall section, an
exploded axonometric, a table of spans — and then have to imagine the building
those drawings describe. Construction Studio lets them build it instead.

Pick a foundation, a wall or frame, a floor and a roof. The building generates
itself on a grid, sized by the span rules of thumb students are taught, and can
then be pulled apart, cut open, stepped through in build order, and compared
against an alternative side by side.

It is modelled on the *modelling* half of Autodesk Revit Structure — grids,
levels, and parametric assemblies — and on the parametric assembly generators
architects already use in SketchUp. There is no analysis in it, deliberately.

| | |
|---|---|
| **Four choices** | Foundation · Wall & Structure · Floor · Roof. Twenty-six systems across the four materials. Change one and the whole building rebuilds. |
| **Sizing** | Preliminary depths from span rules of thumb, with the arithmetic shown: `7.50 m ÷ 23.5 = 319 mm → IPE 330`. A green / amber / red flag says whether the span suits the system. |
| **Detail** | Diagram (centre lines) · Members (real sections) · Full assembly (every stud at 400 mm, and the build-up as stacked layers). |
| **View** | Exploded along the vertical axis · shaded / realistic / wireframe / x-ray · layer isolation · section box. Explode and section box compose. |
| **Teaching** | Live sizing readout · build-sequence animation · labelled build-up diagram with a dimension chain · side-by-side comparison on one shared camera. |
| **Import** | DXF as a traceable underlay or measured into grid lines, OBJ as ghosted site context, and a plan image scaled by two-point calibration. |
| **Export** | PNG with labels, a title block and the copyright. |
| **Files** | Save and open `.json` buildings. Snapshot undo. |

Materials are colour-coded the way a student would shade a drawing — steel
blue-grey, concrete pale grey, timber warm brown, masonry terracotta — with
crisp black edges, in an orthographic axonometric by default.

---

## The systems

| Foundation | Wall & Structure | Floor | Roof |
|---|---|---|---|
| Pad foundations | Steel moment frame | Composite steel floor | Insulated metal deck |
| Strip footings | Steel braced frame | RC slab on beams | Portal frame rafters |
| Raft slab | Steel portal frame | RC flat slab | Trussed rafter roof |
| Piles and caps | Reinforced concrete frame | Waffle slab | Cut rafter roof |
| | RC walls and core | Precast hollowcore | Concrete flat roof |
| | Cavity masonry wall | Timber joisted floor | CLT flat roof |
| | Timber platform frame | CLT floor panels | |
| | Timber post and beam | | |
| | CLT wall panels | | |

Systems do not know about each other. Each declares only what it offers or
needs: a vertical system `provides` either continuous lines of support or
discrete points, and a horizontal system `bears` on one, the other, or either.
When a pairing does not work the app says why —

> *Composite steel floor needs point supports — columns. Add a frame, or choose
> a system that spans onto walls.*

— rather than hiding the option. Students learn more from seeing why something
does not work than from its absence.

---

## Sizing rules

One table drives both the geometry and the readout on screen.

| | | | |
|---|---|---|---|
| Steel beam | L/18 – L/20 | RC beam | h = L/12 – L/15 |
| Composite steel | L/22 – L/25 | RC slab, one way | L/24 – L/28 |
| Steel truss | L/12 | RC flat slab | Lₙ/30 – Lₙ/33 |
| Timber joist | L/15 – L/20 | Waffle slab | L/24 |
| Glulam beam | L/16 – L/17 | Precast hollowcore | L/35 – L/40 |
| CLT panel | L/30 | Masonry slenderness | h_ef / t_ef ≤ 27 |

Columns are sized from tributary area and storey count; portal haunches from a
percentage of the span. Real catalogue sections (tabulated EN 10365 steel) are
searched for the first one deep enough; concrete, glulam and CLT sizes are
generated to the nearest sensible increment.

**These are preliminary-design rules of thumb for learning, not design.** The
app says so, permanently, in the panel. Nothing here replaces an engineer.

---

## Embedding in WordPress

The file is a complete web page. Serve it and put it in an iframe.

1. Upload `construction-studio.html` somewhere on your host — SFTP into
   `/wp-content/uploads/apps/` is the usual place. The WordPress **Media
   Library will not accept `.html`** without a plugin, so use SFTP, cPanel's
   File Manager, or a plugin such as *WP Extra File Types*.

2. Add a **Custom HTML** block to the page:

   ```html
   <div style="position:relative;width:100%;height:80vh;min-height:560px">
     <iframe src="/wp-content/uploads/apps/construction-studio.html"
             title="Construction Studio"
             style="position:absolute;inset:0;width:100%;height:100%;border:0"
             allow="fullscreen"></iframe>
   </div>
   ```

   Use `height:100%` on the iframe rather than `100vh` — Safari on iOS
   mis-measures `vh` inside an iframe and clips the status bar.

3. Serve the page over **HTTPS**. A mixed-content page will block the
   three.js module load.

The app itself is responsive and has been checked at 1560, 1024 and 414 px
wide and inside an iframe. Below 900 px the panel becomes a slide-in sheet;
below 640 px the whole layout stacks.

### three.js

three.js r185 is loaded from the jsDelivr CDN through an import map. If your
students are behind a school firewall that blocks CDNs, the page says so
plainly instead of hanging, and tells you the fix: download

```
https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js
https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/   (the addons used)
```

next to the HTML file and change the two paths in the `<script type="importmap">`
block near the top.

---

## Using it

The first screen already has a building standing on it, and a seven-step tour
offers to walk you through. After that:

| | |
|---|---|
| **Build** | Grid, bays, spans, storeys, and the four part cards. **Change** opens the system picker. |
| **Detail** | Diagram / Members / Full assembly, and what each level of detail draws. |
| **View** | Explode, display style, layer and part isolation, section box. |
| **Teach** | Build sequence, build-up diagram, system comparison. |
| **Context** | DXF, OBJ and image import; underlay opacity; PNG export. |

Click any element to see what it is, why it is that size, and to change or
delete it. Edits are remembered **by position**, so they survive a change to
the grid — and when a change destroys the position an edit belonged to, the app
says so and offers to keep or discard it rather than quietly forgetting.

Keyboard: `1` `2` `3` detail levels, `E` explode, `X` section box, `F` fit,
`Space` play the build sequence, `Esc` deselect, `Ctrl+Z` / `Ctrl+Y` undo and
redo, `Ctrl+S` save, `Ctrl+O` open.

---

## Sources

The systems, build-ups and span rules are drawn from the standard teaching
literature:

- Francis D. K. Ching, *Building Construction Illustrated* — the
  Foundation / Floor / Wall / Roof taxonomy the app navigates by.
- Edward Allen & Joseph Iano, *Fundamentals of Building Construction:
  Materials and Methods* — material-by-material system descriptions.
- Edward Allen & Joseph Iano, *The Architect's Studio Companion* — the shape
  of the span-versus-depth tables.
- Andrea Deplazes, *Constructing Architecture: Materials, Processes,
  Structures* — the solid / filigree distinction used as a secondary filter.
- EN 10365 — hot-rolled steel section dimensions.
- EN 1992-1-1 — span/depth ratios for reinforced concrete.

---

## Technical notes

Roughly 6,900 lines in one file. Nothing is minified; it is meant to be read.

- **Plans, then geometry.** A system's `build()` emits plain-data plans, never
  three.js objects. A repeating group — 216 studs — is a *single* plan, so
  re-planning on a slider drag stays under a millisecond.
- **Merged batches, not instancing.** Each `(part, level, role, material)`
  group merges into one `BufferGeometry`, keeping draw calls low while staying
  frustum-culled. Instancing measures slower below a few thousand objects.
- **Picking inside a merged mesh.** Every batch carries a table of triangle
  ranges; a hit's `faceIndex` binary-searches to an address, and within a
  repeating run collapses by integer division. Clicking one stud out of 216
  works.
- **Per-layer clip planes** so the section box and the explode slider compose
  correctly instead of slicing an exploded stack in the wrong place.
- **One source of truth for build-ups.** The same `layers` array draws the 3D
  wall and the SVG layer diagram, so the drawing and the model cannot disagree.
- WebGL context-loss recovery, label budgeting, and an on-demand render loop
  that pauses when the iframe scrolls out of view.

### Verified

Sizing checked against hand calculation (27 checks, including the section each
column rule produces, not just its load); the generator exercised across every
system, every cross-part combination, edits, orphaned edits and scale; and the
app driven in real Chromium for picking, explode reversibility, detail
round-trips, save round-trips, undo, export, all three importers, orbit
behaviour and three viewport widths plus an iframe (22 checks). Every guided-tour
step is asserted to spotlight a real, on-screen element. Console clean throughout.
