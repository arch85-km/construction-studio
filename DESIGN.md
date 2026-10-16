# Design decisions

The decisions behind Construction Studio, and my reasons for them.
[`ARCHITECTURE.md`](ARCHITECTURE.md) describes how the code is organised, and
the [method notes](construction-studio-method-notes.html) describe what is and
is not modelled and how exact the sizes are. This file records why the tool
is the way it is. Written in October 2026, at version 1.1.0.

— Karam Al-Obaidi

## Why it exists

My students needed to understand how a building's construction works as a
set of systems that have to fit together. What they had did not let them
explore that:

- **Textbooks and drawings** show static sections and details that students
  cannot change, explode or step through.
- **Physical models** are slow to build and show one system at a time, so
  there is no comparing alternatives.

## Why it runs in the browser

- **Nothing to install.** No licence and no admin rights, on lab PCs or on
  students' own laptops.
- **Any device, and embeddable.** It runs on any machine and sits inside my
  website.

## Method

### A building is four choices on a grid

Foundation, walls and structure, floor and roof, each chosen from a
catalogue, on a grid of bays, spans and storeys.

- **How construction is taught.** A building as a set of systems that must
  work together.
- **Compatibility.** Changing one part shows what the others have to do about
  it, and which combinations do not work.
- **Simple enough.** Students get a whole building in minutes, without
  modelling elements one by one.

### Sizes from span rules of thumb, not analysis

Every member is sized from a preliminary-design span rule, with the
arithmetic on screen.

- **What early design uses.** Span-to-depth rules are what architects and
  tutors use at concept stage.
- **The arithmetic on screen.** Students see the ratio working ("7.5 m ÷ 23.5 =
  319 mm → IPE 330") and can repeat it by hand.
- **No false precision.** Analysis results would look like design answers;
  rules of thumb are honestly approximate.

### Explode, section and build sequence

- **See the layers.** Exploding along one vertical axis shows the build-up the
  way it is drawn in lectures.
- **Build order.** Watching the building go up in the order it is built
  teaches sequence on site.
- **Junctions.** Cutting the model open shows where systems meet, which is
  where most of the difficulty of building lives.

### The load path

- **What holds it up.** Students can name every part of a building and still
  not know where the weight goes; the load path answers that.
- **Three directions.** Load is collected horizontally, travels down inclined
  members and goes vertically to the ground, and the thrust at a rafter's
  foot is shown.

### Comparing two systems

- **Choosing a system.** Real design choices are between alternatives on the
  same grid.
- **One camera.** Orbiting one model orbits the other, so the difference is
  what you see.

## Teaching

I use the tool in undergraduate and postgraduate teaching.

The method notes carry no exercises of their own: I removed them.

One feature came from watching students use the tool:

- **The tour opens on every launch**, because students arrive cold each week.
  It stays until they switch it off.

## What it leaves out

- **Structural analysis.** No solver, no internal forces, no strength or
  deflection check. It teaches systems, not structural design.
- **Lateral loads.** No wind or seismic load. Bracing and shear walls are
  drawn, but not sized.
- **Building physics.** No U-values, condensation or acoustics. The insulation
  layer has a thickness and nothing more.
- **Cost and carbon.** No pricing or embodied carbon, although the element
  counts a take-off would need are in the model.

## How a release is checked

Before I teach with a release:

- **I use the live site myself**, as a student would.
- **I build with different systems** and check that the sizes and the load
  path look right.
- **I check some sizes and loads against my own hand calculation.**

## Licensing and archiving

The code is MIT and the teaching material is CC BY 4.0:

- **The code is free to reuse.** Anyone can adapt or embed it.
- **The material is reusable with credit.** Other educators can use the notes
  in their own courses, crediting the source.
- **The cube mark is reserved from both**, so a modified copy cannot pass
  itself off as mine.
- **Open licensing is expected** of this kind of work by my university or
  funders.

Every version since 1.0.1 is archived on Zenodo with its own DOI:

- **Reproducible figures.** A reported number can be traced to the exact build
  that produced it.
- **A citable research output.** The software counts as an output in its own
  right.
- **A permanent archive.** Each version survives even if my website changes.
- **Credit when reused.** Anyone who uses it has a proper way to cite it.

## How this was developed

I designed the application. I defined the problem and the scope: what the tool
is for, who it is for and what it leaves out. I chose the methods and the
sources it relies on. I tested it in use, found and reported the bugs, judged
whether each fix worked, and decided what was released and when.

The code was written with an AI coding assistant, working to my specification
and direction. It wrote most of the code, drafted the documentation, which I
reviewed, diagnosed bugs and proposed fixes, which I then tested, and wrote and
ran the automated tests and release checks. I retain full intellectual
responsibility for the design, the methods and the results, including any
errors.

## Next

- **Other plan shapes**: L-plans, setbacks, atria, cores and stairs, beyond
  one rectangle on a grid.
- **Lateral stability**: how bracing, shear walls and cores resist wind, at
  least qualitatively.
- **Carbon and quantities**: a material take-off and embodied carbon from the
  counts already in the model.
- **Building physics**: U-values and condensation risk for the build-ups.
