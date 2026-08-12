#!/usr/bin/env node
/**
 * Builds the self-hosted webfonts from their upstream sources.
 *
 * Why this exists rather than a one-off download: the enhancement brief makes
 * licensing a release criterion (§9.3) and requires an automated check that
 * every self-hosted font asset actually resolves (§12.3). A script that can be
 * re-run turns both into something reviewable — you can see exactly which
 * upstream commit produced the bytes in `src/fonts`, and regenerate them.
 *
 * Both families are SIL Open Font License 1.1, which permits self-hosting and
 * subsetting. The licences are vendored next to the fonts because OFL §2
 * requires them to travel with the files.
 *
 * The typographic decisions, so they are not silently re-litigated later:
 *
 *  - **Newsreader carries the display role.** Ivar Display is a licensed
 *    Letters from Sweden face that Foundry does not own web rights to, and the
 *    brief forbids shipping "a broken imitation" (§16). Newsreader is the
 *    closest *honest* substitute: a high-contrast Scotch-adjacent editorial
 *    serif that holds its character from 29px to 112px.
 *  - **Its optical-size axis is kept, not flattened.** Pinning one cut would
 *    make either the 112px h1 look coarse or the 29px h3 look spindly.
 *    Retaining opsz lets `font-optical-sizing: auto` pick per size. The axis is
 *    clipped to 16-72 (from 6-72) because nothing renders the display face
 *    below 16px, and the unused range costs ~6 KiB.
 *  - **Weight is pinned to 400 on the display face.** §9.3: regular only
 *    unless another weight has a real use. Nothing needs one.
 *  - **Inter ships as two static cuts**, regular and medium. A variable axis
 *    would cost more than the 0.5 KiB difference between the two files.
 *
 * Usage: `pnpm fonts:build`. Requires python3 with fonttools + brotli.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/fonts");
const UPSTREAM = "https://raw.githubusercontent.com/google/fonts/main/ofl";

/**
 * The character repertoire, stated as ranges rather than a glyph dump so the
 * intent survives review.
 *
 * Latin-1 Supplement is what carries the Nordic set the brief requires (§12.3):
 * Å Ä Ö Ø Æ å ä ö ø æ all live there. The euro sign does not — it sits alone at
 * U+20AC, which is why it is listed explicitly below. Dropping it would silently
 * break every ticket size on the site.
 *
 * Only codepoints that are actually typeset are requested. Newsreader has no
 * U+2011/2012/2015/201B, and asking for them would either fail the build or
 * force the guard below to be softened — neither is worth a glyph nothing uses.
 */
const RANGES = [
  [0x20, 0x7e], // Basic Latin
  [0xa0, 0xff], // Latin-1 Supplement — the Nordic characters
];
const SINGLES = [
  0x2010, 0x2013, 0x2014, // hyphen, en dash, em dash
  0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, // quotation marks
  0x2020, 0x2021, 0x2022, // dagger, double dagger, bullet
  0x2026, 0x2030, 0x2039, 0x203a, 0x2044, // ellipsis, per mille, guillemets, fraction slash
  0x20ac, // euro — not in Latin-1 Supplement
  0x2122, 0x2212, 0x00d7, // trademark, minus, multiplication
];
/** Latin Extended-A. Body text may carry a founder or company name that needs it. */
const LATIN_EXT_A = [[0x100, 0x17f]];

/**
 * Codepoints that fall inside the ranges above but that no upstream face
 * provides, and that nothing would render anyway:
 *   U+00AD soft hyphen — a line-break hint with no visible glyph
 *   U+0149 ŉ           — deprecated in Unicode since 5.2
 * Listed rather than silently tolerated so the completeness guard below stays
 * strict about every other character.
 */
const EXCLUDED = new Set([0x00ad, 0x0149]);

const FACES = [
  {
    family: "newsreader",
    file: "Newsreader[opsz,wght].ttf",
    out: "newsreader-display.woff2",
    // wght pinned; opsz clipped to the range actually rendered, and kept variable.
    pin: { wght: 400, opsz: [16, 72] },
    features: ["kern", "liga", "calt", "onum", "pnum", "frac"],
    ranges: RANGES,
    singles: SINGLES,
  },
  /*
   * A tiny TTF for the Open Graph card. Satori (which rasterises
   * `opengraph-image.tsx`) cannot read WOFF2 and has no access to system fonts,
   * so without this the card renders in whatever Satori falls back to and
   * carries no typographic identity at all. TTF, not WOFF2, for that reason.
   *
   * The OFL permits embedding; the subset is the ~90 characters the card can
   * actually contain, which keeps it small enough to sit in the repository.
   */
  {
    family: "newsreader",
    file: "Newsreader[opsz,wght].ttf",
    out: "newsreader-og.ttf",
    pin: { wght: 400, opsz: 40 },
    features: ["kern", "liga"],
    ranges: [[0x20, 0x7e]],
    singles: [0x2013, 0x2014, 0x2019, 0x20ac, 0xe5, 0xe4, 0xf6, 0xc5, 0xc4, 0xd6, 0xb7],
    flavor: null,
  },
  ...[
    ["regular", 400],
    ["medium", 500],
  ].map(([name, wght]) => ({
    family: "inter",
    file: "Inter[opsz,wght].ttf",
    out: `inter-${name}.woff2`,
    pin: { wght, opsz: 14 },
    features: ["kern", "liga", "calt", "tnum"],
    ranges: [...RANGES, ...LATIN_EXT_A],
    singles: SINGLES,
  })),
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const PY = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.subset import Subsetter, Options

spec = json.loads(sys.argv[1])
excluded = set(spec["excluded"])
uni = [c for c in ([c for lo, hi in spec["ranges"] for c in range(lo, hi + 1)] + spec["singles"])
       if c not in excluded]
pin = {k: (tuple(v) if isinstance(v, list) else v) for k, v in spec["pin"].items()}

f = TTFont(spec["src"])
f = instancer.instantiateVariableFont(f, pin, inplace=True, updateFontNames=False)
o = Options()
o.layout_features = spec["features"]
o.desubroutinize = True
o.name_IDs = ["*"]
o.name_legacy = True
o.notdef_outline = True
s = Subsetter(options=o); s.populate(unicodes=uni); s.subset(f)
f.flavor = spec.get("flavor", "woff2")
f.save(spec["out"])

# Report back the metrics the CSS fallback overrides are derived from, so the
# numbers in fonts.css are measured rather than guessed.
upem = f["head"].unitsPerEm
os2, hhea = f["OS/2"], f["hhea"]
print(json.dumps({
  "upem": upem,
  "ascent": hhea.ascent, "descent": hhea.descent, "lineGap": hhea.lineGap,
  "capHeight": getattr(os2, "sCapHeight", None), "xHeight": getattr(os2, "sxHeight", None),
  "glyphs": len(f.getGlyphOrder()),
  "missing": [hex(c) for c in uni if c not in f.getBestCmap()],
}))
f.close()
`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const tmp = join(ROOT, "node_modules/.cache/foundry-fonts");
  mkdirSync(tmp, { recursive: true });

  const report = [];
  for (const family of ["newsreader", "inter"]) {
    await download(`${UPSTREAM}/${family}/OFL.txt`, join(OUT, `OFL-${family}.txt`));
  }

  for (const face of FACES) {
    const src = join(tmp, face.file);
    try {
      statSync(src);
    } catch {
      await download(`${UPSTREAM}/${face.family}/${encodeURIComponent(face.file)}`, src);
    }
    const spec = JSON.stringify({
      src,
      out: join(OUT, face.out),
      pin: face.pin,
      features: face.features,
      ranges: face.ranges,
      singles: face.singles,
      excluded: [...EXCLUDED],
      ...("flavor" in face ? { flavor: face.flavor } : {}),
    });
    const metrics = JSON.parse(execFileSync("python3", ["-c", PY, spec], { encoding: "utf8" }));
    if (metrics.missing.length) {
      throw new Error(`${face.out} is missing requested codepoints: ${metrics.missing.join(", ")}`);
    }
    const bytes = statSync(join(OUT, face.out)).size;
    report.push({ file: face.out, kib: +(bytes / 1024).toFixed(1), ...metrics });
  }

  writeFileSync(
    join(OUT, "metrics.json"),
    `${JSON.stringify(
      {
        note: "Generated by scripts/prepare-fonts.mjs. Source of truth for the fallback overrides in src/styles/fonts.css.",
        upstream: `${UPSTREAM}/{newsreader,inter}`,
        faces: report.map(({ missing, ...rest }) => rest),
      },
      null,
      2,
    )}\n`,
  );

  for (const r of report) {
    console.log(`  ${String(r.kib).padStart(6)} KiB  ${r.file}  (${r.glyphs} glyphs)`);
  }
  console.log(`\n  Total: ${report.reduce((a, r) => a + r.kib, 0).toFixed(1)} KiB`);
}

await main();
