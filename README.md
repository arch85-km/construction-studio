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
| **Five choices** | Foundation · Ground floor · Wall & Structure · Floor · Roof. Thirty systems across the four materials. Change one and the whole building rebuilds. |
| **Connections** | The joints are derived, not chosen: a steel column on concrete gets a base plate and holding-down bolts, a concrete one gets starter bars, a timber post gets a galvanised shoe. Click any of them and it explains what it has to do. |
| **Sizing** | Preliminary depths from span rules of thumb, with the arithmetic shown: `7.50 m ÷ 23.5 = 319 mm → IPE 330`. A green / amber / red flag says whether the span suits the system. |
| **Detail** | Diagram (centre lines) · Members (real sections) · Full assembly (every stud at 400 mm, and each wall built as its real stack of layers). |
| **View** | Exploded — layers rise on a shared vertical axis while each wall's leaves slide apart along its own normal · Open — swings the enclosure aside to show the structure inside · shaded / realistic / wireframe / x-ray · layer isolation · section box. |
| **Load path** | Follow the weight from where it lands to where it goes. Arrows point the way it travels — spread over a **surface**, collected **horizontally** by joists and beams, running down an **inclined** rafter, then **vertically** to the ground — with a sleeve round each column that widens and warms as the load accumulates. Gravity by tributary area: the hand calculation, not an analysis. |
| **Teaching** | Live sizing readout · build-sequence animation · labelled build-up diagram with a dimension chain · side-by-side comparison on one shared camera. |
| **Import** | DXF as a traceable underlay or measured into grid lines, OBJ as ghosted site context, and a plan image scaled by two-point calibration. |
| **Export** | PNG with labels, a title block and the copyright. |
| **Files** | Save and open `.json` buildings. Snapshot undo. |

Materials are colour-coded the way a student would shade a drawing — steel
blue-grey, concrete pale grey, timber warm brown, masonry terracotta — with
crisp black edges, in an orthographic axonometric by default.

---

## The systems

| Foundation | Ground floor | Wall & Structure | Floor | Roof |
|---|---|---|---|---|
| Pad foundations | Ground-bearing slab | Steel moment frame | Composite steel floor | Insulated metal deck |
| Strip footings | Beam and block | Steel braced frame | RC slab on beams | Portal frame rafters |
| Raft slab | Suspended RC slab | Steel portal frame | RC flat slab | Trussed rafter roof |
| Piles and caps | Suspended timber floor | Reinforced concrete frame | Waffle slab | Cut rafter roof |
| | | RC walls and core | Precast hollowcore | Concrete flat roof |
| | | Cavity masonry wall | Timber joisted floor | CLT flat roof |
| | | Timber platform frame | CLT floor panels | |
| | | Timber post and beam | | |
| | | CLT wall panels | | |

The ground floor is its own choice because it behaves nothing like an upper
floor: a ground-bearing slab does not span at all, and everything about damp
and insulation changes once the floor is in contact with the earth.

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
| **Build** | Grid, bays, spans, storeys, and the five part cards. **Change** opens the system picker. |
| **Detail** | Diagram / Members / Full assembly, connections on or off, and what each level of detail draws. |
| **View** | Explode, Open, display style, layer and part isolation, section box. |
| **Teach** | Build sequence, build-up diagram, system comparison. |
| **Context** | DXF, OBJ and image import; underlay opacity; PNG export. |
| **Analysis** | The load path from roof to foundation, filtered by direction, and the building's use class. |

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

Roughly 8,300 lines in one file. Nothing is minified; it is meant to be read.

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
  A wall really is built as that stack — outside in, each layer its own object
  in its own material — which is what lets the explode pull it apart.
- **Connections are derived, never chosen.** Once the parts are built, the
  junctions are read off the plans and resolved from the pair of materials
  meeting there. A new system inherits the right joints the moment it declares
  its material.
- **The takedown has two invariants.** The loads on every support must add up to
  the loads on every floor — nothing lost on the way down — and the reactions
  every level's members deliver must add up to that level's load — nothing lost
  travelling sideways either. Both are asserted, in the browser and out of it.
- **A member's load path is read from its direction**, not from its name:
  `|uy| > 0.94` is vertical, `< 0.09` horizontal, anything between is inclined.
  A rafter, a brace and a portal leg classify themselves, and so will whatever
  is added next.
- **Resolution drops only for a sustained gesture.** OrbitControls fires `start`
  and `end` back-to-back inside a single wheel event, so acting on them
  literally reallocated the drawing buffer twice per notch of the scroll wheel —
  the flashing. Now the drop waits to see whether the gesture lasts, and the
  redraw happens in the same task as the resize, never a frame later.
- **The orthographic depth range is fitted to the model, every frame.** An
  orthographic camera spreads its depth buffer evenly between near and far, so
  a range fixed at 6000 units — as it was — gives 0.36 mm of depth resolution on
  a 24-bit buffer and 9 cm on a 16-bit one. Wall build-ups stack layers 1 mm
  thick, so on a low-precision buffer neighbouring leaves are within a step or
  two of each other and swap places as the camera turns: that is the tearing.
  The range is now measured from the camera along the way it is looking, over
  the model's corners *and* the label positions, which brings it to about 25
  units — a couple of microns per step.
- **A single-storey system is honest about it.** A portal frame spans the full
  width in one go, so it builds one storey however many are asked for. The
  level list every other part of the app reads — datums, sequence, takedown,
  comparison — is now the list that was actually built, and the Storeys field
  locks itself and says why rather than accepting a number it will discard. The
  document keeps the number the student typed, so switching back to a moment
  frame restores it.
- **Everything imported can be placed.** A DXF plan, an OBJ of the neighbouring
  block and a photographed drawing all carry the same five numbers — where,
  how high, which way round, how big — and the same controls change them. The
  geometry is built about its own centre with the transform on a wrapper above
  it, so a rotation turns the drawing rather than swinging it around the model
  origin, and a scale grows it where it stands. Drag it into place or type the
  numbers; either way it is one undo step and it saves with the file.
- **Labels do not blink.** Two labels a few pixels apart used to fall either
  side of a cell boundary in a coarse occupancy grid and take turns winning it
  — ten times a second, which is what "A" and "Ground +0.00" were doing as the
  camera turned. They are now compared as the rectangles they actually occupy,
  the test has a dead band in both directions, nothing may change state twice
  inside 450 ms, and the decision is not retaken at all while the camera is
  moving. The label layer also stays up through a gesture: at the couple of
  dozen labels a building carries, hiding it saved nothing measurable and cost
  a visible blink on every nudge.
- **The shadow map is fitted to the building.** A shadow map is a depth picture
  taken from the light, and a surface is in shadow when it is further from the
  light than that picture says. Spread 1024 pixels over the 120 metres this
  used to cover and each pixel stands for twelve centimetres of building — so a
  wall compares itself against a depth measured twelve centimetres away and
  decides, in stripes, that it is in its own shadow. That was the black
  hatching that crawled across the walls in Realistic. Covering the building
  rather than a field around it, at 2048 rather than 1024, with a bias scaled
  to what one texel is still worth, takes it from 117 mm per texel to 21.
- **The tour greets everyone, every time.** It used to run once per browser and
  never again, which is wrong for a page students arrive at cold each week —
  and on a shared machine, or a browser that had already opened it once, it
  meant nobody saw it. The bubble now carries *Don't show this on launch*,
  which takes effect the moment it is ticked and shows its stored state next
  time, so the decision can be taken back: start the tour by hand and untick
  it. `?tour=1` opens it regardless, for a link in a handout.

  The spotlight is a hole in a dimmed overlay, placed from a measurement — so
  it follows the window. Pressing Fullscreen on the embed takes the frame from
  1500 × 760 to the whole screen, and a measurement taken once left the hole
  over the middle of the model with the dock it was pointing at sitting
  undimmed in the corner. Each viewport change now opens a short window during
  which the tour keeps re-placing itself every frame until the layout stops
  moving: one pass on the event is not enough, because the app's own layout is
  still settling when `resize` fires — measured at 274 px short.
- **The drawing buffer is asked for explicitly.** A stencil is requested, not
  because anything draws with one, but because of what the driver allocates
  when it is not: three.js defaults it off, and ANGLE — how Chrome reaches the
  GPU on Windows — may then hand back a 16-bit depth buffer where asking for a
  stencil gets the packed 24-plus-8 instead. Sixteen bits over the range this
  model needs is under a millimetre of depth resolution, against build-up
  layers a millimetre thick. `preserveDrawingBuffer` is off: the PNG export
  renders and reads back inside one synchronous block and never needed it, and
  leaving it on made Chrome resolve the multisampled buffer into a copy every
  frame. **About → This browser** shows what the browser actually gave back —
  GPU, depth bits, samples, and the resulting millimetres per depth step — so
  a fault that appears on one machine and not another can be read rather than
  guessed at.
- WebGL context-loss recovery, label budgeting, and an on-demand render loop
  that pauses when the iframe scrolls out of view.

### Verified

Sizing checked against hand calculation (27 checks, including the section each
column rule produces, not just its load); the generator exercised across every
system, every cross-part combination, edits, orphaned edits and scale; and the
app driven in real Chromium for picking, explode reversibility, detail
round-trips, save round-trips, undo, export, all three importers, orbit
behaviour, wall assembly order, the load path and its three directions, and
three viewport widths plus an iframe (58 checks); the load takedown checked
against hand arithmetic in both directions, including the eaves thrust
(18 checks); and the orbit measured for buffer reallocations so the flashing
cannot come back. The depth range is asserted to be fitted to the model and to
clip nothing — not the geometry, not the labels — through a full orbit and at
full explode and open, which is measured rather than assumed: an empty viewport
passes every scene-graph test there is. A separate sweep drives the range from
25 units to 1.5 million and shows tearing appearing as the depth step passes a
few millimetres, which is the evidence that the range is the lever. What a
single-storey system builds is asserted too, in and out of the browser: two
levels from four, two datums, nothing planned above the roof, the field locked
with a reason, and four storeys back when a frame is chosen instead. Label
flicker is caught by watching every change to a label's display as it happens
rather than sampling settled camera positions — the first version of that
harness sampled, and reported zero while two labels were visibly taking turns.
Placing an import is checked end to end: dragged, it follows the pointer to
within 2 cm; typed, it lands where the numbers say; and both survive undo and a
save round trip. Shadow acne is caught by tiling each frame and
taking the median tile's roughness — a real edge raises a few tiles, acne
raises nearly all of them, so the median is what separates detail from a
defect; it reads 3.6–5.8 on a build with the old shadow settings and 0–1.7 on
this one, holds through an orbit, and the shadow frustum is asserted still to
contain the whole building, so the acne has not been traded for no shadows. Every guided-tour step is asserted to spotlight a real, on-screen
element and to keep its bubble wholly inside the viewport at two window sizes,
and the tour is opened twice in one browser to prove it comes back — the thing
the old one-shot flag made impossible to check, and the whole embed is
reproduced as reported — the app in an iframe on a page with a Fullscreen
button — to check that the spotlight follows the dock through going full screen
and back, and every band of every build-up drawing is asserted either to pick
out real geometry or to say plainly that it is not modelled. Console clean
throughout.
