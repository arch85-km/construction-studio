# Structural Studio

A 3D structural modelling, analysis and drafting environment for architecture
students. One self-contained HTML file, no build step, no server, no backend.

**© Karam Al-Obaidi**

---

## What it is

Architecture students are taught structure abstractly and then handed either a
black-box calculator or a professional package with a six-month learning curve.
Neither shows the **load path** — how gravity actually travels from roof to slab
to beam to column to footing.

Structural Studio closes that gap. It is modelled in spirit on Autodesk Revit
Structure and Tekla Structures, but stripped to what a design student can learn
in one studio session, and it runs entirely in a browser.

| | |
|---|---|
| **Modelling** | Grids, storey levels, columns, beams, braces, slabs, load-bearing walls, pad footings. A wizard generates a complete frame from bays × spans × storeys. |
| **Analytical model** | Independent of the physical model and linked to it, as in Revit 2023 and later — regenerated only when you ask, never silently. Nodes, releases, rigid offsets, boundary conditions. |
| **Analysis** | A real 3D frame analysis by the direct stiffness method: 12-DOF beam elements, static condensation for end releases, partitioned solution of K·u = F, dense LDLᵀ factorisation. |
| **Load takedown** | Tributary areas from slab to beam to column to footing, with the 45° yield-line polygons drawn on screen and a hand-versus-computer comparison table. |
| **Drafting** | Plans, sections and elevations, dimensions and tags, member and quantity schedules, and a PNG export with a title block. |
| **Materials** | Steel (IPE / HEA / HEB / SHS / RHS / CHS), reinforced concrete, timber (glulam, sawn, CLT) and masonry. |
| **Units** | Metric, Eurocode-flavoured: kN, m, kN/m², MPa; EN 1991-1-1 imposed loads; EN 1990 combinations (1.35G + 1.50Q and the rest). |

---

## Running it

Open `structural-studio.html` in any recent browser. That is the whole
installation.

It loads three.js (r185) from a CDN, so the first run needs an internet
connection; after that the browser caches it. Everything else — the solver, the
section library, the load code data — is in the file.

### Keyboard

| | |
|---|---|
| `S` `G` `C` `B` `R` `A` `W` `F` `P` `Q` `M` | Select · Grid · Column · Beam · Brace · slAb · Wall · Footing · suPport · load (Q) · Measure |
| `Esc` | Cancel the current operation, then return to Select |
| `F5` | Solve |
| `Ctrl/⌘ + Z` / `Shift + Z` | Undo / redo |
| `Ctrl/⌘ + S` / `O` | Save / open a project |
| `Ctrl/⌘ + A` | Select all |
| `Ctrl/⌘ + Shift + T` | Run the solver verification suite |
| `F` | Zoom to fit |

Adding `?selftest=1` to the address runs the verification suite on load.

---

## Embedding in WordPress

**Use an iframe. Do not paste the file into a Custom HTML block.** WordPress
will break it, in four separate ways:

- `wptexturize` converts straight quotes to curly ones, silently corrupting
  JavaScript string literals.
- `wpautop` injects `<p>` and `<br>` tags into the markup.
- `<script>` tags are stripped from Custom HTML blocks unless the saving user
  holds the `unfiltered_html` capability — administrators on single-site
  installs only, and many security plugins remove it even then.
- Optimisation plugins (WP Rocket, Autoptimize, LiteSpeed) reorder and
  concatenate scripts, which breaks the import map. The import map **must** be
  parsed before any module script.

An iframe sidesteps all of it.

### 1. Upload the file

WordPress blocks `.html` uploads to the media library by default, so upload it
over SFTP, or through your host's file manager, to:

```
/wp-content/uploads/apps/structural-studio.html
```

### 2. Add a Custom HTML block containing only this

```html
<div style="position:relative;width:100%;padding-top:66.67%;min-height:520px;">
  <iframe src="/wp-content/uploads/apps/structural-studio.html"
          style="position:absolute;inset:0;width:100%;height:100%;border:0;"
          allow="fullscreen; clipboard-write"
          allowfullscreen
          loading="lazy"
          title="Structural Studio — 3D structural modelling and analysis">
  </iframe>
</div>
```

No `<script>` tag, so there is nothing for WordPress to strip, and the block
saves correctly for any user role.

### Notes

- **Host it on the same domain as the WordPress site.** Safari and Chrome
  partition storage for cross-origin iframes, which would silently break the
  autosave.
- **Do not add a `sandbox` attribute.** If your host insists on one, it must
  include `allow-scripts allow-same-origin allow-downloads allow-modals`.
- If you cannot use SFTP, the *Advanced iFrame* or *Custom iFrame* plugins
  provide a shortcode wrapper around the same iframe.
- A fixed viewport height suits a modelling application better than auto-sizing.
  `padding-top:66.67%` gives a 3:2 box; adjust to taste.

### If the CDN is blocked

On a school network that blocks CDNs, three.js will not load and the app shows
an explanatory screen rather than a blank page. To run fully offline, download
three.js r185 and place `build/` and `examples/jsm/` next to the HTML file, then
change the import map at the top of `structural-studio.html` to:

```json
{ "imports": {
    "three": "./three/build/three.module.js",
    "three/addons/": "./three/examples/jsm/"
} }
```

---

## Verifying the analysis

The application carries its own benchmark suite and will run it on demand —
**Help → Verify solver**, `Ctrl+Shift+T`, or `?selftest=1`.

Twenty-seven benchmarks solve textbook problems with the application's own
solver and compare the answer against the closed-form result:

- simply supported, cantilever, fixed–fixed and propped-cantilever beams under
  point and uniform loads — deflections, moments and reactions
- axial extension `PL/EA` and torsional twist `TL/GJ`
- member end releases by static condensation
- portal frame sway with pinned and fixed bases
- **the vertical-column direction-cosine branch**, and the Eurocode-to-element
  axis mapping, asserted as a numerical stiffness ratio
- rigid end offsets
- load-combination superposition against a single equivalent case
- global equilibrium and 3D grillage symmetry
- the two-way slab takedown against `q × A`

Every solve also runs a global equilibrium check and reports it in the Results
panel, so a broken load path is visible immediately rather than hidden in a
plausible-looking number.

### Deliberately out of scope

No second-order or P-delta effects, no buckling or lateral-torsional buckling,
no tension-only bracing, no plate or shell elements, no modal or time-history
analysis, no cracked-section or creep behaviour, no connection or reinforcement
design, no code compliance checking. Slabs are load-collecting surfaces, not
finite elements.

The utilisation check is an elastic stress ratio plus a deflection limit. It is
a teaching aid, and the interface says so wherever it appears.

---

## Conventions

**Units.** Everything internal is metre–kilonewton–second. Section catalogues
are entered in mm and cm² and converted once, at load.

**Axis naming.** The section library follows Eurocode: `Iy` is the **strong**
axis, `Iz` the weak one. The frame element wants the opposite mapping, and the
swap happens in exactly one function, `FEM.sectionToLocal`. Getting it backwards
produces answers that look entirely plausible and are about three times wrong,
which is why a benchmark asserts the resulting ratio numerically.

**Local axes.** Local *x* runs from the start node to the end node. For a
horizontal member local *y* is global up; for a member within 2.6° of vertical
the reference switches to global Z, so an unrotated column's local *y* points
along global Z — meaning it resists sway in Z with its strong axis. The column
properties panel says so, with a rotation control to swap it.

**Sign convention.** Sagging moment is positive, and diagrams are drawn on the
tension face.

**Load takedown.** The textbook equivalent UDL for a two-way panel
(`w_eq = q·Lx/3`) is a *bending-moment* equivalence, not a load equivalence.
Feeding it to the analysis would put about a third too much load into the frame
and break vertical equilibrium. The analysis therefore receives the true
triangular and trapezoidal shapes; `w_eq` is reported for hand-checking only.

---

## Files

| | |
|---|---|
| `structural-studio.html` | The entire application |
| `README.md` | This file |

## Sources

Section properties follow EN 10365. Imposed loads follow EN 1991-1-1 Table 6.2;
load combinations follow EN 1990 equation 6.10. The equivalent-lateral-force
seismic option follows the ASCE 7 §12.8 formulation. Values are reproduced for
teaching and should be checked against the current standard before being used
for anything else.
