#!/usr/bin/env node
/**
 * Load takedown accuracy.
 *
 * The method notes promise two invariants: the loads on all the supports add
 * up to the loads on all the floors and walls, and the reactions every level's members
 * deliver add up to that level's load. This checks both, for every template
 * under every use class, together with the arithmetic the notes print: the
 * per-level table, the wall load per metre, the eaves thrust and the four
 * column rules. It also reads the Load path card, so the figures a student
 * sees are checked, not only the figures the code holds.
 *
 * Runs the real file in headless Chromium:  npm test
 * (Playwright's own Chromium if installed, otherwise the system Chrome.)
 */
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'construction-studio.html'));

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  if (!cond || process.env.VERBOSE)
    console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`);
};
// relative to the size of the thing being compared, so 19 238 kN and 3.8 kN
// are held to the same standard
const near = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));

/* --- serve the file over http and refuse anything off-origin ------------- */
const srv = http.createServer((q, r) => {
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(html);
});
await new Promise(res => srv.listen(0, '127.0.0.1', res));
const origin = `http://127.0.0.1:${srv.address().port}`;

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [], offOrigin = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('**/*', route => {
  const u = route.request().url();
  if (u.startsWith(origin) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  offOrigin.push(u); return route.abort();
});
await page.goto(origin + '/?tour=0');
await page.waitForFunction(() => window.ConstructionStudio && ConstructionStudio.Render.groups);

/* --- the documented constants (method notes, "What it calculates") ------- */
const NOTES = {
  // service loads, kN/m² on plan: imposed by use (EN 1991-1-1 Table 6.2, UK NA),
  // partitions on every floor, a roof's imposed load, and each system's dead load
  IMPOSED: { residential: 1.5, office: 2.5, retail: 4.0, industrial: 7.5 },
  PARTITIONS: 0.8, ROOF_IMPOSED: 0.6,
  DEAD: {
    'floor.steel.composite': 4.3, 'floor.concrete.oneWay': 6.5, 'floor.concrete.flatSlab': 7.5,
    'floor.concrete.waffle': 6.5, 'floor.precast.hollowcore': 5.0, 'floor.timber.joist': 0.6,
    'floor.timber.clt': 2.8, 'roof.steel.deck': 1.0, 'roof.steel.portal': 0.5,
    'roof.timber.truss': 1.1, 'roof.timber.rafter': 1.1, 'roof.concrete.slab': 6.5,
    'roof.timber.clt': 1.0,
  },
  // the walls' own weight, kN per m² of face, at each system's default settings
  WALL: {
    'vertical.masonry.cavity': 4.35, 'vertical.concrete.shear': 6.4, 'vertical.timber.clt': 0.85,
    'vertical.timber.platform': 0.5, 'vertical.steel.moment': 0.6, 'vertical.steel.braced': 0.6,
    'vertical.concrete.frame': 0.6, 'vertical.timber.postBeam': 0.85, 'vertical.steel.portal': 0.3,
  },
  // permissible stress, kPa, by rule label
  f: { 'Steel column': 0.6 * 275e3, 'RC column': 0.4 * 30e3,
       'Timber post': 0.6 * 24e3, 'Masonry pier': 2.5e3 },
};

const consts = await page.evaluate(() => {
  const { SIZING } = ConstructionStudio;
  const rules = {};
  for (const [id, r] of Object.entries(SIZING.R))
    if (r.byArea) rules[r.label] = {
      id,
      area1000: r.area({ N: 1000 }),
      load: r.load({ Atrib: 12.5, ws: [2, 7, 7] }),
      load0: r.load({ Atrib: 12.5, ws: [2] }),
      text: r.fmt({ Atrib: 12.5, ws: [2, 7, 7], N: r.load({ Atrib: 12.5, ws: [2, 7, 7] }) }, 0, null),
    };
  const { IMPOSED, PARTITIONS, ROOF_IMPOSED, DEAD } = SIZING;
  const r2 = v => Math.round(v * 100) / 100;
  const wall = Object.fromEntries(Object.entries(SIZING.WALL).map(([k, fn]) => [k, r2(fn({}))]));
  // a thicker leaf weighs more: 215 mm brick outside, 100 mm block in
  const thick = r2(SIZING.WALL['vertical.masonry.cavity']({ outerT: 215, innerT: 100 }));
  return { IMPOSED, PARTITIONS, ROOF_IMPOSED, DEAD, wall, thick, rules };
});

console.log('Documented constants');
for (const [k, v] of Object.entries(NOTES.IMPOSED))
  ok(`imposed, ${k} = ${v} kN/m²`, consts.IMPOSED[k] === v, `app has ${consts.IMPOSED[k]}`);
ok(`partitions = ${NOTES.PARTITIONS} kN/m²`, consts.PARTITIONS === NOTES.PARTITIONS);
ok(`roof imposed = ${NOTES.ROOF_IMPOSED} kN/m²`, consts.ROOF_IMPOSED === NOTES.ROOF_IMPOSED);
for (const [k, v] of Object.entries(NOTES.DEAD))
  ok(`dead, ${k} = ${v} kN/m²`, consts.DEAD[k] === v, `app has ${consts.DEAD[k]}`);
for (const [k, v] of Object.entries(NOTES.WALL))
  ok(`wall, ${k} = ${v} kN/m² of face`, consts.wall[k] === v, `app has ${consts.wall[k]}`);
ok('wall weight follows the leaf thickness', consts.thick === Math.round((0.021 * 215 + 0.020 * 100 + 0.2) * 100) / 100,
   `${consts.thick}`);
ok('no dead load the notes do not list', Object.keys(consts.DEAD).every(k => k in NOTES.DEAD),
   Object.keys(consts.DEAD).filter(k => !(k in NOTES.DEAD)).join(', '));
for (const [label, f] of Object.entries(NOTES.f)) {
  const r = consts.rules[label];
  ok(`${label}: rule exists`, !!r);
  if (!r) continue;
  ok(`${label}: A = N / ${f / 1e3} MPa`, near(r.area1000, 1000 / f * 1e6),
     `1000 kN → ${r.area1000.toFixed(1)} mm², want ${(1000 / f * 1e6).toFixed(1)}`);
  // the same sum as the takedown: each level carried, roof first
  ok(`${label}: N = A_trib × Σ w of the levels carried`, near(r.load, 12.5 * (2 + 7 + 7)), `${r.load}`);
  ok(`${label}: one storey carries the roof only`, near(r.load0, 12.5 * 2), `${r.load0}`);
  ok(`${label}: printed sum is the one computed`,
     r.text.startsWith(`12.5 m² × (2.0 + 2 × 7.0) kN/m² = 200 kN`), r.text);
}

/* --- every template, under every use class ------------------------------- */
const templates = await page.evaluate(() => ConstructionStudio.App.TEMPLATES.map(t => t.id));
const USES = ['residential', 'office', 'retail', 'industrial'];

for (const tpl of templates) {
  for (const use of USES) {
    const r = await page.evaluate(([tpl, use]) => {
      const CS = ConstructionStudio;
      const T = CS.App.TEMPLATES.find(t => t.id === tpl);
      const doc = T.make();
      doc.use = use;
      const slotSys = { floor: (doc.slots.floor || {}).sys, roof: (doc.slots.roof || {}).sys,
                        vertical: (doc.slots.vertical || {}).sys };
      CS.Store.load(doc);
      CS.App.rebuild();
      const d = CS.Loads.paths(CS.Store.doc, CS.Gen.plans);
      const strip = s => ({ kind: s.kind, level: s.level, count: s.count || 1, R: s.R,
                            role: s.role, each: s.each, Ra: s.Ra, Rb: s.Rb, toGround: s.toGround,
                            thrust: s.thrust, spread: s.spread || null, pitch: s.pitch,
                            a: s.a, b: s.b, N: s.N });
      // what each column, pad and pile was sized for, beside what the takedown
      // says reaches that node at that height
      const sized = [];
      // a strip footing takes the wall's load per metre: the card's kN/m
      for (const pl of CS.Gen.plans)
        if (pl.role === 'strip' && pl.meta)
          sized.push({ what: `strip ${pl.addr}`, N: pl.meta.wLine,
                       want: d.onWalls ? d.perMetre : null, strip: true });
      if (!d.onWalls) {
        const at = (x, z) => d.supports.find(s => Math.abs(s.x - x) < 1e-6 && Math.abs(s.z - z) < 1e-6);
        for (const pl of CS.Gen.plans) {
          if (!pl.meta || pl.meta.N == null) continue;
          if (pl.role === 'column') {
            const sp = at(pl.a[0], pl.a[2]);
            const top = Math.max(pl.a[1], pl.b[1]);
            const here = sp && sp.perLevel.find(p => Math.abs(p.y - top) < 1e-6);
            sized.push({ what: `column ${sp ? sp.ref : '?'} under ${here ? here.name : '?'}`,
                         N: pl.meta.N, want: here ? here.N : null });
          } else if (pl.role === 'pad' || pl.role === 'cap') {
            const xs = pl.poly.map(p => p[0]), zs = pl.poly.map(p => p[1]);
            const sp = at((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2);
            sized.push({ what: `${pl.role} ${sp ? sp.ref : '?'}`, N: pl.meta.N, want: sp ? sp.N : null });
          }
        }
      }
      return {
        sized, slotSys, groundY: d.levels[0].y,
        tied: CS.Gen.plans.some(p => p.role === 'tie'),
        portal: (doc.slots.vertical || {}).sys === 'vertical.steel.portal',
        name: T.name, grid: { W: d.grid.W, D: d.grid.D, area: d.grid.area },
        levels: d.levels.length, rows: d.rows, total: d.total, onWalls: d.onWalls,
        runLen: d.runLen, perMetre: d.perMetre,
        supports: d.supports.map(s => ({ N: s.N, trib: s.trib, perLevel: s.perLevel,
                                          length: s.length, perMetre: s.perMetre })),
        maxN: d.maxN, worstN: d.worst ? d.worst.N : null,
        segs: d.segs.map(strip),
      };
    }, [tpl, use]);

    const tag = `${r.name} / ${use}`;
    console.log(tag);
    const area = r.grid.W * r.grid.D;

    /* the table: area × w per level, roof on top, running total down */
    ok(`${tag}: one row per level above ground`, r.rows.length === r.levels - 1,
       `${r.rows.length} rows, ${r.levels} levels`);
    ok(`${tag}: level area = W × D`, near(r.grid.area, area), `${r.grid.area} vs ${area}`);
    let run = 0, rowsOk = true, roofOk = true, wallsOk = true;
    r.rows.forEach((row, i) => {
      // the level's own construction + partitions + what is put on it
      const sys = row.isRoof ? r.slotSys.roof : r.slotSys.floor;
      const want = Math.round(((NOTES.DEAD[sys] ?? NaN) + (row.isRoof ? 0 : NOTES.PARTITIONS) +
                               (row.isRoof ? NOTES.ROOF_IMPOSED : NOTES.IMPOSED[use])) * 100) / 100;
      if (row.isRoof !== (i === 0) || row.sys !== sys) roofOk = false;
      // the storey of wall under the level: kN/m² of face × height, along the perimeter
      const g = NOTES.WALL[r.slotSys.vertical] ?? 0;
      const line = Math.round(g * row.wallH * 100) / 100;
      const wall = line * 2 * (r.grid.W + r.grid.D);
      if (row.wallG !== g || !near(row.wallLine, line) || !near(row.wall, wall)) wallsOk = false;
      run += area * want + wall;
      if (row.w !== want || !near(row.load, area * want) || !near(row.cumulative, run)) rowsOk = false;
    });
    ok(`${tag}: roof row on top only, each row its own system`, roofOk);
    ok(`${tag}: w = dead + partitions + imposed; rows area × w, accumulated top down`, rowsOk,
       r.rows.map(x => `${x.name} ${x.w}`).join(', '));
    ok(`${tag}: each storey's walls = kN/m² of face × height × perimeter`, wallsOk,
       r.rows.map(x => `${x.name} ${x.wallG}×${x.wallH}`).join(', '));
    ok(`${tag}: total = last running figure`, near(r.total, run), `${r.total} vs ${run}`);

    /* invariant 1: nothing lost going down */
    if (r.onWalls) {
      ok(`${tag}: wall run = 2(W + D)`, near(r.runLen, 2 * (r.grid.W + r.grid.D)));
      ok(`${tag}: kN/m × run = total`, near(r.perMetre * r.runLen, r.total));
      const last = r.supports[r.supports.length - 1];
      ok(`${tag}: wall at the foundation carries the total`, near(last.N, r.total),
         `${last.N} vs ${r.total}`);
      const strips = r.sized.filter(s => s.strip);
      if (strips.length) {
        const off = strips.filter(s => s.N == null || !near(s.N, s.want, 1e-9));
        ok(`${tag}: ${strips.length} strip footings sized for the card's kN/m`, off.length === 0,
           off.slice(0, 2).map(s => `${s.what}: ${s.N} kN/m, card ${s.want.toFixed(1)} kN/m`).join('; '));
      }
    } else {
      const tribSum = r.supports.reduce((a, s) => a + s.trib, 0);
      const nSum = r.supports.reduce((a, s) => a + s.N, 0);
      ok(`${tag}: tributary areas add up to the floor`, near(tribSum, area), `${tribSum} vs ${area}`);
      ok(`${tag}: column loads add up to the total`, near(nSum, r.total), `${nSum} vs ${r.total}`);
      ok(`${tag}: every column grows down the building`, r.supports.every(s =>
        s.perLevel.every((p, i) => i === 0 || p.N >= s.perLevel[i - 1].N)));
      ok(`${tag}: worst column is the largest`, near(r.worstN, Math.max(...r.supports.map(s => s.N))));
      // the size a student is given rests on the load the card shows
      const off = r.sized.filter(s => s.want == null || !near(s.N, s.want, 1e-9));
      ok(`${tag}: ${r.sized.length} columns and footings sized for the takedown load`,
         r.sized.length > 0 && off.length === 0,
         off.slice(0, 2).map(s => `${s.what}: sized ${s.N?.toFixed(1)}, takedown ${s.want?.toFixed(1)}`).join('; '));
    }

    /* invariant 2: nothing lost going sideways, level by level */
    for (const row of r.rows) {
      const mine = r.segs.filter(s => s.kind !== 'vertical' && s.level === row.id);
      if (!mine.length) {
        ok(`${tag}: ${row.name} has members carrying its load`, false,
           `${row.load.toFixed(1)} kN on ${row.name} reaches no spanning member`);
        continue;
      }
      // what the level's members hand to the walls and columns, after passing
      // it down their chain (deck → secondary → primary → column, and so on)
      const delivered = mine.reduce((a, s) => a + (s.toGround || 0), 0);
      ok(`${tag}: ${row.name} members deliver the level's load`, near(delivered, row.load, 1e-6),
         `${delivered.toFixed(3)} vs ${row.load.toFixed(3)} kN`);
      // and no member hands on more or less than it carries
      const kept = mine.filter(s => !near((s.Ra + s.Rb), s.each, 1e-6));
      ok(`${tag}: ${row.name} each member hands on what it carries`, kept.length === 0,
         kept.slice(0, 2).map(s => `${s.role}: ${s.each} vs ${s.Ra}+${s.Rb}`).join('; '));
    }

    /* the spread of a pitched roof: H = w × s × L² ÷ (8 × h), three-pinned, from the
       roof's own load. Where it goes: a tie takes it (walls get nothing), a
       portal pushes out at its bases (h measured from the base), else the walls */
    const incl = r.segs.filter(s => s.kind === 'inclined');
    if (incl.length) {
      const roof = r.rows[0];
      let bad = null;
      for (const s of incl) {
        const p = s.spread;
        const how = r.tied ? 'tie' : r.portal ? 'frame' : 'walls';
        const alongZ = Math.abs(s.b[2] - s.a[2]) >= Math.abs(s.b[0] - s.a[0]);
        const L = alongZ ? r.grid.D : r.grid.W;
        const tan = Math.tan(s.pitch * Math.PI / 180);
        const low = Math.min(s.a[1], s.b[1]);
        const h = (L / 2) * tan + (how === 'frame' ? low - r.groundY : 0);
        const H = p ? roof.w * p.s * L * L / (8 * h) : NaN;
        if (!p || p.how !== how || !near(p.L, L) || !near(p.h, h, 1e-6) || !near(p.H, H, 1e-6) ||
            !near(s.thrust, how === 'tie' ? 0 : H, 1e-6)) { bad = { s, how, L, h, H }; break; }
      }
      ok(`${tag}: roof spread H = w × s × L² ÷ (8 × h), ${r.tied ? 'taken by the tie' : r.portal ? 'at the portal bases' : 'into the walls'}`,
         !bad, bad ? JSON.stringify({ got: bad.s.spread, want: { how: bad.how, L: bad.L, h: bad.h, H: bad.H } }) : '');
    }
  }
}

/* --- the chain, against the hand calculation -------------------------------
   Load goes deck → secondary → primary → column, roof → purlin → rafter →
   column, and a pair of rafters meeting at the apex sends everything to its
   feet. Each figure below is the one a student would work by hand. */
{
  const h = await page.evaluate(() => {
    const CS = ConstructionStudio;
    const run = id => {
      CS.Store.load(CS.App.TEMPLATES.find(t => t.id === id).make()); CS.App.rebuild();
      return CS.Loads.paths(CS.Store.doc, CS.Gen.plans);
    };
    const pick = (d, lv, role) => d.segs.filter(s => s.level === lv && s.role === role);
    const o = run('office'), L1 = o.rows.find(r => r.name === 'Level 1');
    const sec = pick(o, L1.id, 'secondary')[0], pri = pick(o, L1.id, 'primary');
    const s = run('shed'), roof = s.rows[0], raf = pick(s, roof.id, 'rafter');
    const hs = run('house'), hr = hs.rows[0];
    const ms = run('masonry'), mr = ms.rows[0];
    return {
      w1: L1.w, sx: o.grid.sx, sz: o.grid.sz, secStep: Math.hypot(...sec.step), secL: sec.length, secN: sec.count,
      direct: o.segs.filter(s => s.kind === 'direct' && s.level === L1.id).reduce((a, s) => a + s.toGround, 0),
      area: o.grid.area,
      secEach: sec.each, priMax: Math.max(...pri.map(p => p.each)), priMin: Math.min(...pri.map(p => p.each)),
      wr: roof.w, shedSx: s.grid.sx, shedD: s.grid.D,
      rafMax: Math.max(...raf.map(p => p.each)), rafApex: Math.max(...raf.map(p => Math.min(p.Ra, p.Rb))),
      rafFoot: Math.max(...raf.map(p => Math.max(p.Ra, p.Rb))),
      truss: pick(hs, hr.id, 'truss').map(p => [p.each, p.Ra, p.Rb]), ties: pick(hs, hr.id, 'tie').length,
      rafters: pick(ms, mr.id, 'rafter').map(p => [p.each, p.Ra, p.Rb]), ridges: pick(ms, mr.id, 'ridge').length,
    };
  });
  console.log('The chain, by hand');
  ok('office secondary = its spacing × span × w', near(h.secEach, h.secStep * h.secL * h.w1, 1e-6),
     `${h.secEach.toFixed(1)} vs ${h.secStep} × ${h.secL} × ${h.w1}`);
  // an interior primary carries the secondaries resting on it from both sides
  ok('office interior primary = the secondaries resting on it', near(h.priMax, h.secN * h.secEach, 1e-6),
     `${h.priMax.toFixed(1)} vs ${h.secN} × ${h.secEach.toFixed(1)}`);
  ok('office edge primary = half that', near(h.priMin, h.secN * h.secEach / 2, 1e-6), `${h.priMin.toFixed(1)}`);
  // the strip beside each column line, which no drawn beam carries, goes to the columns
  ok('office column-line strips straight to the columns', near(h.direct, h.w1 * (h.area - 9 * h.secN * h.secStep * h.secL), 1e-6),
     `${h.direct.toFixed(1)} kN`);
  ok('shed interior rafter = frame spacing × half span × w', near(h.rafMax, h.shedSx * h.shedD / 2 * h.wr, 1e-6),
     `${h.rafMax.toFixed(1)} vs ${h.shedSx} × ${h.shedD / 2} × ${h.wr}`);
  ok('shed rafter: all of it to the foot, none to the apex', h.rafApex < 1e-9 && near(h.rafFoot, h.rafMax, 1e-6),
     `apex ${h.rafApex}, foot ${h.rafFoot}`);
  ok('truss chords: all to the foot', h.truss.length > 0 && h.truss.every(([e, a, b]) => Math.min(a, b) < 1e-9 && near(Math.max(a, b), e, 1e-9)),
     JSON.stringify(h.truss));
  ok('the truss tie carries no roof load', h.ties === 0, `${h.ties} tie families sharing it`);
  ok('cut rafters: all to the foot', h.rafters.length > 0 && h.rafters.every(([e, a, b]) => Math.min(a, b) < 1e-9 && near(Math.max(a, b), e, 1e-9)),
     JSON.stringify(h.rafters));
  ok('the ridge board carries no roof load', h.ridges === 0, `${h.ridges} ridge families sharing it`);
}

/* --- what the Load path card says, for one wall and one column building -- */
for (const tpl of ['house', 'office', 'masonry', 'shed']) {
  const c = await page.evaluate(tpl => {
    const CS = ConstructionStudio;
    const T = CS.App.TEMPLATES.find(t => t.id === tpl);
    CS.Store.load(T.make());
    CS.App.rebuild();
    CS.LoadPath.on = true;
    const card = CS.LoadPath.card();
    const d = CS.LoadPath.data;
    const cells = [...card.querySelectorAll('table.loads tbody tr')]
      .map(tr => [...tr.children].map(td => td.textContent));
    const out = {
      name: T.name, summary: card.querySelector('summary .s').textContent,
      formula: [...card.querySelectorAll('.formula')].map(e => e.textContent),
      cells, total: d.total, floors: d.floors, wallTotal: d.wallTotal,
      rows: d.rows.map(r => [r.name, r.w, r.load, r.wall, r.cumulative]),
      perMetre: d.perMetre, runLen: d.runLen, worst: d.worst && { trib: d.worst.trib, N: d.worst.N },
    };
    CS.LoadPath.on = false;
    return out;
  }, tpl);
  const tag = `${c.name} card`;
  console.log(tag);
  ok(`${tag}: header total`, c.summary === `${Math.round(c.total)} kN to the ground`, c.summary);
  const tableOk = c.rows.every((r, i) => c.cells[i] && c.cells[i][0] === r[0] &&
    +c.cells[i][1] === Math.round(r[1] * 10) / 10 && +c.cells[i][2] === Math.round(r[2]) &&
    +c.cells[i][3] === Math.round(r[3]) && +c.cells[i][4] === Math.round(r[4]));
  ok(`${tag}: table matches the takedown`, tableOk, JSON.stringify(c.cells));
  if (c.perMetre) {
    const want = `(${Math.round(c.floors)} kN floors + ${Math.round(c.wallTotal)} kN walls) ÷ ` +
                 `${c.runLen.toFixed(1)} m of wall = ${c.perMetre.toFixed(1)} kN/m`;
    ok(`${tag}: foundation line`, c.formula[0] === want, `${c.formula[0]}  /  want ${want}`);
  }
  if (c.worst) {
    const f = c.formula[0];
    // "A m² × (roof + n × floor) kN/m² [+ C kN cladding] = N kN"
    // (a single level prints without the brackets: "75.00 m² × 1.1 kN/m² ...")
    const m = f.match(/^([\d.]+) m² × \(?(\d+(?:\.\d+)?)(?: \+ (\d+) × (\d+(?:\.\d+)?))?\)? kN\/m²(?: \+ (\d+) kN cladding)? = (\d+) kN$/);
    ok(`${tag}: worst column line is a sum that adds up`, !!m &&
       Math.abs(+m[1] * (+m[2] + (+m[3] || 0) * (+m[4] || 0)) + (+m[5] || 0) - +m[6]) <= 1.5 &&
       +m[6] === Math.round(c.worst.N), f);
  }
  // the roof's spread, printed as a sum that multiplies out to its answer:
  // "... = w [× s] × L² ÷ (8 × h) = H kN ..."
  const spreadLine = c.formula.find(f => f.startsWith('H = '));
  if (spreadLine) {
    const m = spreadLine.match(/([\d.]+)(?: × ([\d.]+))? × ([\d.]+)² ÷ \(8 × ([\d.]+)\) = ([\d.]+) kN/);
    const val = m && +m[1] * (m[2] ? +m[2] : 1) * (+m[3]) ** 2 / (8 * +m[4]);
    ok(`${tag}: spread line multiplies out`, !!m && Math.abs(val - +m[5]) <= Math.max(0.15, 0.02 * +m[5]),
       `${spreadLine}  →  ${val && val.toFixed(2)}`);
    const want = { house: 'tension in each tie', masonry: 'per metre of wall', shed: 'at each base' }[tpl];
    ok(`${tag}: spread says where it goes`, spreadLine.endsWith(want), spreadLine);
  }
}

/* --- the last step: what the foundation does with the load -----------------
   Each foundation reports as it is sized: strips per metre, a raft as the
   pressure on the ground, pads and pile caps by the heaviest column. The
   load it is sized for is the whole takedown, and the diagram draws a plate
   under every footing, on the foundation layer. */
for (const [tpl, fnd, kind] of [['masonry', null, 'strip'], ['masonry', 'foundation.concrete.raft', 'raft'],
                                ['office', null, 'pad'], ['office', 'foundation.concrete.raft', 'raft'],
                                ['rc', null, 'pile']]) {
  const c = await page.evaluate(([tpl, fnd]) => {
    const CS = ConstructionStudio;
    const T = CS.App.TEMPLATES.find(t => t.id === tpl);
    const doc = T.make();
    if (fnd) doc.slots.foundation = { sys: fnd, p: {} };
    CS.Store.load(doc); CS.App.rebuild(); CS.LoadPath.on = true;
    const d = CS.LoadPath.data, card = CS.LoadPath.card();
    const box = [...card.querySelectorAll('.sizing')].find(e => /At the foundation/.test(e.textContent));
    const role = { strip: 'strip', raft: 'raft', pad: 'pad', cap: 'pile' };
    const feet = CS.Gen.plans.filter(p => p.part === 'foundation' && p.meta && role[p.role]);
    let plates = 0;
    CS.Render.groups.loads.traverse(o => { if (o.isMesh && o.userData.layer === 0 && o.material.opacity < 0.5) plates++; });
    const out = {
      name: T.name, total: d.total, perMetre: d.perMetre || null, maxN: d.maxN || null,
      W: d.grid.W, D: d.grid.D, q: CS.Store.doc.soil.qAllow,
      title: box && box.querySelector('.ttl').textContent,
      lines: box ? [...box.querySelectorAll('.formula')].map(e => e.textContent) : [],
      feet: feet.map(p => ({ role: p.role, N: p.meta.N, wLine: p.meta.wLine, A: p.meta.A,
                             n: p.meta.n, formula: p.meta.formula })),
      plates,
    };
    CS.LoadPath.on = false;
    return out;
  }, [tpl, fnd]);
  const tag = `${c.name} on ${kind}`;
  console.log(tag);
  ok(`${tag}: the card names the foundation`, !!c.title && c.title.endsWith(
     { strip: 'strip footings', raft: 'raft', pad: 'the heaviest pad', pile: 'the heaviest pile cap' }[kind]), c.title);
  ok(`${tag}: a plate under every footing`, c.feet.length > 0 && c.plates === c.feet.length,
     `${c.plates} plates, ${c.feet.length} footings`);
  if (kind === 'strip') {
    ok(`${tag}: every strip sized for the card's kN/m`, c.feet.every(f => near(f.wLine, c.perMetre, 1e-9)));
    ok(`${tag}: the card shows the strip's own sizing`, c.lines[1] === c.feet[0].formula, c.lines[1]);
  }
  if (kind === 'raft') {
    const A = (c.W + 0.6) * (c.D + 0.6), p = c.total / A;
    ok(`${tag}: the raft carries the whole building`, near(c.feet[0].N, c.total, 1e-9), `${c.feet[0].N} vs ${c.total}`);
    ok(`${tag}: pressure = total ÷ raft area`, near(c.feet[0].A, A, 1e-9) &&
       c.lines[0].endsWith(`= ${p.toFixed(1)} kPa, on ${c.q} kPa soil`), c.lines[0]);
  }
  if (kind === 'pad' || kind === 'pile') {
    const heaviest = c.feet.reduce((a, b) => b.N > a.N ? b : a);
    ok(`${tag}: the heaviest footing carries the heaviest column`, near(heaviest.N, c.maxN, 1e-9),
       `${heaviest.N} vs ${c.maxN}`);
    ok(`${tag}: the card shows that footing's sizing`, c.lines[0] === heaviest.formula, c.lines[0]);
    if (kind === 'pile') ok(`${tag}: piles = load ÷ 600 kN, rounded up`,
       c.feet.every(f => f.n === Math.max(1, Math.ceil(f.N / 600))));
  }
}

/* --- the diagram sits on the structure it describes ------------------------
   Each wall band beside the middle of its own wall, each column sleeve on its
   own column: at rest, and with the model exploded and opened. A band placed
   by its own position was once moved by the explode, which sets positions
   outright; every band then collapsed toward the plan's origin. */
for (const tpl of ['house', 'office']) {
  const r = await page.evaluate(tpl => {
    const CS = ConstructionStudio;
    const T = CS.App.TEMPLATES.find(t => t.id === tpl);
    CS.Store.load(T.make()); CS.View.set('detail', 'members'); CS.App.rebuild();
    const d = CS.Loads.compute(CS.Store.doc), G = d.grid, v = CS.View.state;
    const bands = () => { const m = []; CS.Render.groups.loads.traverse(o => {
      // bands and sleeves only: the foundation plates (layer 0) are checked above
      if (o.isMesh && o.material.opacity < 0.5 && o.userData.layer !== 0) m.push(o); }); return m; };
    const centre = o => { o.updateMatrixWorld(true); const g = o.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      return [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2]; };
    const measure = () => {
      // how far the walls have swung out at this Open, read off a real leaf
      let swing = 0;
      for (const o of CS.Realize.groups) { const w = o.userData.wall; if (!w) continue;
        swing = (o.position.x * w.nx + o.position.z * w.nz) - ((w.n - 1) / 2 - w.i) * v.wallGap * v.explode; break; }
      let worst = 0; const spots = new Set();
      for (const m of bands()) {
        const [x, z] = centre(m); spots.add(x.toFixed(2) + ',' + z.toFixed(2));
        if (d.onWalls) {
          const sides = [[G.W / 2, 0, 0, -1], [G.W, G.D / 2, 1, 0], [G.W / 2, G.D, 0, 1], [0, G.D / 2, -1, 0]];
          const dist = Math.min(...sides.map(s => Math.hypot(x - s[0] - s[2] * swing, z - s[1] - s[3] * swing)));
          worst = Math.max(worst, Math.max(0, dist - 1.2));   // a band stands off its wall by up to 1.2 m
        } else {
          worst = Math.max(worst, Math.min(...d.supports.map(s => Math.hypot(x - s.x, z - s.z))));
        }
      }
      return { n: bands().length, worst, spots: spots.size };
    };
    CS.View.set('explode', 0); CS.View.set('open', 0); CS.LoadPath.on = true;
    const rest = measure();
    CS.View.set('explode', 0.62); CS.View.set('open', 0.52);
    const opened = measure();
    CS.View.set('explode', 0); CS.View.set('open', 0); CS.LoadPath.on = false;
    return { name: T.name, onWalls: d.onWalls, columns: d.supports.length, rest, opened };
  }, tpl);
  const what = r.onWalls ? 'wall bands beside their own walls' : 'column sleeves on their own columns';
  ok(`${r.name}: ${what}, at rest`, r.rest.n > 0 && r.rest.worst < 1e-6, `${r.rest.worst.toFixed(2)} m off`);
  ok(`${r.name}: ${what}, exploded and opened`, r.opened.n > 0 && r.opened.worst < 1e-6,
     `${r.opened.worst.toFixed(2)} m off`);
  if (!r.onWalls) ok(`${r.name}: one sleeve position per column`, r.rest.spots === r.columns,
     `${r.rest.spots} positions for ${r.columns} columns`);
}

/* --- the CSV exports: the figures behind the card, with the caution ------- */
console.log('CSV exports');
for (const tpl of ['house', 'office']) {
  const want = await page.evaluate(tpl => {
    const CS = ConstructionStudio;
    CS.Store.load(CS.App.TEMPLATES.find(t => t.id === tpl).make()); CS.App.rebuild();
    CS.App.tab = 'analysis'; CS.App.refreshChrome();
    const d = CS.Loads.compute(CS.Store.doc);
    return { name: CS.App.TEMPLATES.find(t => t.id === tpl).name, rows: d.rows.length, total: d.total,
             sized: CS.Gen.plans.filter(p => p.meta && p.meta.ruleId).length };
  }, tpl);
  for (const [label, kind] of [['Loads CSV', 'loads'], ['Sizes CSV', 'sizes']]) {
    const tag = `${want.name}: ${label}`;
    try {
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }),
                                      page.click(`button:has-text("${label}")`)]);
      const raw = readFileSync(await dl.path(), 'utf8');
      ok(`${tag}: starts with the UTF-8 byte-order mark, for Excel`, raw.charCodeAt(0) === 0xfeff);
      const txt = raw.replace(/^﻿/, '');
      const lines = txt.split('\n'), body = lines.filter(l => !l.startsWith('#')).slice(1);
      ok(`${tag}: downloads as …-${kind}.csv`, dl.suggestedFilename().endsWith(`-${kind}.csv`), dl.suggestedFilename());
      ok(`${tag}: carries the not-for-construction caution`, /Not for construction/.test(txt));
      ok(`${tag}: no NaN or undefined`, !/NaN|undefined/.test(txt));
      if (kind === 'loads') {
        ok(`${tag}: one row per level`, body.length === want.rows, `${body.length} rows`);
        const last = body[body.length - 1].split(',');
        const running = +last[14];
        ok(`${tag}: running total = the card's total`, near(running, want.total, 1e-5), `${running} vs ${want.total}`);
      } else {
        ok(`${tag}: one row per sized element`, body.length === want.sized, `${body.length} vs ${want.sized}`);
      }
    } catch (e) { ok(`${tag}: downloads`, false, e.message.split('\n')[0]); }
  }
}

/* --- a 1.1.0 file saved with Use "Roof", which is not a use ---------------- */
{
  const r = await page.evaluate(() => {
    const CS = ConstructionStudio;
    const json = JSON.stringify(CS.Model.serialize(CS.App.TEMPLATES.find(t => t.id === 'house').make()));
    const old = JSON.parse(json); old.use = 'roof';
    const doc = CS.Model.deserialize(JSON.stringify(old));
    CS.Store.load(doc); CS.App.rebuild(); CS.LoadPath.on = true;
    const text = CS.LoadPath.card().textContent; CS.LoadPath.on = false;
    return { use: CS.Store.doc.use, saysRoof: /imposed \(roof\)/.test(text) };
  });
  await page.waitForTimeout(50);
  const toast = await page.evaluate(() => [...document.querySelectorAll('.toast, [class*="toast"]')]
    .some(e => /not a use/.test(e.textContent)));
  ok('1.1.0 "Roof" use opens as Office', r.use === 'office', r.use);
  ok('… and the card no longer says "(roof)"', !r.saysRoof);
  ok('… and the student is told', toast);
}

/* --- pads under a wall building: the four corners share the building ------ */
for (const [bx, bz] of [[1, 1], [2, 2]]) {
  const r = await page.evaluate(([bx, bz]) => {
    const CS = ConstructionStudio;
    const doc = CS.App.TEMPLATES.find(t => t.id === 'house').make();
    Object.assign(doc.grid, { bx, bz });
    doc.slots.foundation = { sys: 'foundation.concrete.pad', p: {} };
    CS.Store.load(doc); CS.App.rebuild();
    const pads = CS.Gen.plans.filter(p => p.role === 'pad');
    return { n: pads.length, sum: pads.reduce((a, p) => a + p.meta.N, 0), total: CS.Loads.compute(CS.Store.doc).total,
             addrs: new Set(pads.map(p => p.addr)).size,
             nan: pads.some(p => !isFinite(p.meta.N) || /NaN/.test(p.meta.formula)) };
  }, [bx, bz]);
  ok(`pads under walls, ${bx}×${bz} bays: four, no NaN`, r.n === 4 && !r.nan, JSON.stringify(r));
  ok(`pads under walls, ${bx}×${bz} bays: they carry the whole building`, near(r.sum, r.total, 1e-9),
     `${r.sum} vs ${r.total}`);
  ok(`pads under walls, ${bx}×${bz} bays: each has its own address`, r.addrs === r.n, `${r.addrs} of ${r.n}`);
}

/* --- an untied rafter roof on a frame pushes the eaves, not walls --------- */
{
  const line = await page.evaluate(() => {
    const CS = ConstructionStudio;
    const doc = CS.App.TEMPLATES.find(t => t.id === 'office').make();
    doc.slots.roof = { sys: 'roof.timber.rafter', p: {} };
    CS.Store.load(doc); CS.App.rebuild(); CS.LoadPath.on = true;
    const f = [...CS.LoadPath.card().querySelectorAll('.formula')].map(e => e.textContent).find(t => t.startsWith('H = '));
    CS.LoadPath.on = false; return f;
  });
  ok('cut roof on a frame: thrust per metre of eaves', !!line && line.endsWith('kN per metre of eaves'), line);
}

ok('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
ok('no off-origin requests', offOrigin.length === 0, offOrigin.slice(0, 3).join(' | '));

await browser.close();
srv.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
