#!/usr/bin/env node
/**
 * Load takedown accuracy.
 *
 * The method notes promise two invariants: the loads on all the supports add
 * up to the loads on all the floors, and the reactions every level's members
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
  LOADING: { residential: 9, office: 11, retail: 12, industrial: 14, roof: 5 },
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
      load: r.load({ Atrib: 12.5, storeys: 3, w: 7 }),
      load0: r.load({ Atrib: 12.5, storeys: 0, w: 7 }),
      text: r.fmt({ Atrib: 12.5, storeys: 3, w: 7, N: r.load({ Atrib: 12.5, storeys: 3, w: 7 }) }, 0, null),
    };
  return { LOADING: SIZING.LOADING, rules };
});

console.log('Documented constants');
for (const [k, v] of Object.entries(NOTES.LOADING))
  ok(`LOADING.${k} = ${v} kN/m²`, consts.LOADING[k] === v, `app has ${consts.LOADING[k]}`);
for (const [label, f] of Object.entries(NOTES.f)) {
  const r = consts.rules[label];
  ok(`${label}: rule exists`, !!r);
  if (!r) continue;
  ok(`${label}: A = N / ${f / 1e3} MPa`, near(r.area1000, 1000 / f * 1e6),
     `1000 kN → ${r.area1000.toFixed(1)} mm², want ${(1000 / f * 1e6).toFixed(1)}`);
  // the same sum as the takedown: the roof once, then a floor per storey below it
  ok(`${label}: N = A_trib × (roof + (storeys − 1) × w)`,
     near(r.load, 12.5 * (NOTES.LOADING.roof + 2 * 7)), `${r.load}`);
  ok(`${label}: one storey carries the roof only`,
     near(r.load0, 12.5 * NOTES.LOADING.roof), `${r.load0}`);
  ok(`${label}: printed sum is the one computed`,
     r.text.startsWith(`12.5 m² × (${NOTES.LOADING.roof} + 2 × 7) kN/m² = ${Math.round(r.load)} kN`), r.text);
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
      CS.Store.load(doc);
      CS.App.rebuild();
      const d = CS.Loads.paths(CS.Store.doc, CS.Gen.plans);
      const strip = s => ({ kind: s.kind, level: s.level, count: s.count || 1, R: s.R,
                            thrust: s.thrust, pitch: s.pitch, a: s.a, b: s.b, N: s.N });
      // what each column, pad and pile was sized for, beside what the takedown
      // says reaches that node at that height
      const sized = [];
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
        sized,
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
    const wFloor = NOTES.LOADING[use];

    /* the table: area × w per level, roof on top, running total down */
    ok(`${tag}: one row per level above ground`, r.rows.length === r.levels - 1,
       `${r.rows.length} rows, ${r.levels} levels`);
    ok(`${tag}: level area = W × D`, near(r.grid.area, area), `${r.grid.area} vs ${area}`);
    let run = 0, rowsOk = true, roofOk = true;
    r.rows.forEach((row, i) => {
      const want = i === 0 ? NOTES.LOADING.roof : wFloor;
      if (row.isRoof !== (i === 0)) roofOk = false;
      run += area * want;
      if (row.w !== want || !near(row.load, area * want) || !near(row.cumulative, run)) rowsOk = false;
    });
    ok(`${tag}: roof row on top only`, roofOk);
    ok(`${tag}: rows are area × w, accumulated top down`, rowsOk);
    ok(`${tag}: total = last running figure`, near(r.total, run), `${r.total} vs ${run}`);

    /* invariant 1: nothing lost going down */
    if (r.onWalls) {
      ok(`${tag}: wall run = 2(W + D)`, near(r.runLen, 2 * (r.grid.W + r.grid.D)));
      ok(`${tag}: kN/m × run = total`, near(r.perMetre * r.runLen, r.total));
      const last = r.supports[r.supports.length - 1];
      ok(`${tag}: wall at the foundation carries the total`, near(last.N, r.total),
         `${last.N} vs ${r.total}`);
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
      const delivered = mine.reduce((a, s) => a + 2 * s.R * s.count, 0);
      ok(`${tag}: ${row.name} members deliver the level's load`, near(delivered, row.load, 1e-6),
         `${delivered.toFixed(3)} vs ${row.load.toFixed(3)} kN`);
    }

    /* the thrust the card prints: H = V / tan(pitch) */
    for (const s of r.segs.filter(s => s.kind === 'inclined' && s.thrust > 0)) {
      const want = s.R / Math.tan(s.pitch * Math.PI / 180);
      if (!near(s.thrust, want, 1e-9)) {
        ok(`${tag}: thrust = R / tan(pitch)`, false, `${s.thrust} vs ${want}`);
        break;
      }
    }
  }
}

/* --- what the Load path card says, for one wall and one column building -- */
for (const tpl of ['house', 'office']) {
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
      cells, total: d.total, rows: d.rows.map(r => [r.name, r.w, r.load, r.cumulative]),
      perMetre: d.perMetre, runLen: d.runLen, worst: d.worst && { trib: d.worst.trib, N: d.worst.N },
    };
    CS.LoadPath.on = false;
    return out;
  }, tpl);
  const tag = `${c.name} card`;
  console.log(tag);
  ok(`${tag}: header total`, c.summary === `${Math.round(c.total)} kN to the ground`, c.summary);
  const tableOk = c.rows.every((r, i) => c.cells[i] && c.cells[i][0] === r[0] &&
    +c.cells[i][1] === Math.round(r[1]) && +c.cells[i][2] === Math.round(r[2]) &&
    +c.cells[i][3] === Math.round(r[3]));
  ok(`${tag}: table matches the takedown`, tableOk, JSON.stringify(c.cells));
  if (c.perMetre) {
    const want = `${Math.round(c.total)} kN ÷ ${c.runLen.toFixed(1)} m of wall = ${c.perMetre.toFixed(1)} kN/m`;
    ok(`${tag}: foundation line`, c.formula[0] === want, `${c.formula[0]}  /  want ${want}`);
  }
  if (c.worst) {
    const f = c.formula[0];
    const m = f.match(/^([\d.]+) m² × \((\d+(?:\.\d+)?)(?: \+ (\d+) × (\d+(?:\.\d+)?))?\) kN\/m² = (\d+) kN$/);
    ok(`${tag}: worst column line is a sum that adds up`, !!m &&
       Math.abs(+m[1] * (+m[2] + (+m[3] || 0) * (+m[4] || 0)) - +m[5]) <= 1 &&
       +m[5] === Math.round(c.worst.N), f);
  }
  for (const f of c.formula) {
    const m = f.match(/^([\d.]+) kN ÷ tan ([\d.]+)° = ([\d.]+) kN outward$/);
    if (m) ok(`${tag}: printed thrust follows from printed R and pitch`,
      Math.abs(+m[1] / Math.tan(+m[2] * Math.PI / 180) - +m[3]) <= 0.15, f);
  }
}

ok('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
ok('no off-origin requests', offOrigin.length === 0, offOrigin.slice(0, 3).join(' | '));

await browser.close();
srv.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
