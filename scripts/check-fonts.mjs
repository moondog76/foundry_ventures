#!/usr/bin/env node
/**
 * Release gate for the self-hosted webfonts.
 *
 * The site previously shipped a hand-written `@font-face` pointing at
 * `/fonts/IvarDisplay-Regular.woff2`. That file never existed. Every heading on
 * every route rendered in Georgia, every page logged a console 404, and none of
 * it was caught for the entire life of the site — because nothing checked.
 *
 * So this is a gate, not the warning it used to be. §12.3 of the enhancement
 * brief requires an automated test for every self-hosted font asset; the check
 * runs in `pnpm verify` and fails the build rather than printing advice.
 *
 * What it verifies, in order of how badly each would fail in production:
 *
 *  1. Every file `src/styles/fonts.ts` references exists on disk. A missing file
 *     is a build error under `next/font/local`, but catching it here names the
 *     font rather than surfacing a module-resolution stack trace.
 *  2. Each file is real WOFF2 — the `wOF2` magic number. Guards against a
 *     truncated download or an LFS pointer committed by mistake.
 *  3. Each declares the Nordic repertoire the brief requires. A subset that
 *     silently dropped Å or Ø would render tofu only on the pages that happen to
 *     use them, which is exactly the kind of defect that reaches production.
 */

import { readFileSync, existsSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = path.join(ROOT, "src", "fonts");
const LOADER = path.join(ROOT, "src", "styles", "fonts.ts");

/** The characters §12.3 names explicitly, plus the euro every ticket size needs. */
const REQUIRED = "ÅÄÖØÆåäöøæ€";

/** Minimal WOFF2 table-directory walk — enough to read `cmap` coverage. */
function decodeWoff2Coverage(buf) {
  // WOFF2 brotli-compresses the whole table block, so coverage needs a real decode.
  const numTables = buf.readUInt16BE(12);
  let p = 48;
  const tables = [];
  for (let i = 0; i < numTables; i += 1) {
    const flags = buf.readUInt8(p);
    p += 1;
    let tag = flags & 0x3f;
    if (tag === 0x3f) {
      tag = buf.toString("ascii", p, p + 4);
      p += 4;
    } else {
      tag = KNOWN_TAGS[tag];
    }
    const [origLength, read1] = readBase128(buf, p);
    p = read1;
    let transformLength = null;
    const xform = (flags >> 6) & 0x03;
    if ((tag === "glyf" || tag === "loca") && xform === 0) {
      const [tl, read2] = readBase128(buf, p);
      transformLength = tl;
      p = read2;
    } else if (tag !== "glyf" && tag !== "loca" && xform === 1) {
      const [tl, read2] = readBase128(buf, p);
      transformLength = tl;
      p = read2;
    }
    tables.push({ tag, length: transformLength ?? origLength });
  }
  const totalCompressed = buf.readUInt32BE(20);
  const compressed = buf.subarray(p, p + totalCompressed);
  const data = brotliDecompressSync(compressed);
  let offset = 0;
  for (const t of tables) {
    if (t.tag === "cmap") return readCmap(data.subarray(offset, offset + t.length));
    offset += t.length;
  }
  return null;
}

const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

function readBase128(buf, p) {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    const byte = buf.readUInt8(p);
    p += 1;
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return [value, p];
  }
  throw new Error("malformed base128 value");
}

function readCmap(tbl) {
  const covered = new Set();
  const n = tbl.readUInt16BE(2);
  for (let i = 0; i < n; i += 1) {
    const off = tbl.readUInt32BE(4 + i * 8 + 4);
    const format = tbl.readUInt16BE(off);
    if (format !== 4) continue;
    const segX2 = tbl.readUInt16BE(off + 6);
    const endBase = off + 14;
    const startBase = endBase + segX2 + 2;
    const deltaBase = startBase + segX2;
    const rangeBase = deltaBase + segX2;
    for (let s = 0; s < segX2 / 2; s += 1) {
      const end = tbl.readUInt16BE(endBase + s * 2);
      const start = tbl.readUInt16BE(startBase + s * 2);
      const delta = tbl.readInt16BE(deltaBase + s * 2);
      const rangeOff = tbl.readUInt16BE(rangeBase + s * 2);
      if (start === 0xffff) continue;
      for (let c = start; c <= end && c !== 0x10000; c += 1) {
        let g;
        if (rangeOff === 0) g = (c + delta) & 0xffff;
        else {
          const gi = rangeBase + s * 2 + rangeOff + (c - start) * 2;
          if (gi + 1 >= tbl.length) continue;
          g = tbl.readUInt16BE(gi);
          if (g !== 0) g = (g + delta) & 0xffff;
        }
        if (g !== 0) covered.add(c);
      }
    }
  }
  return covered;
}

async function main() {
  const problems = [];

  if (!existsSync(FONT_DIR)) {
    problems.push(`src/fonts does not exist. Run \`pnpm fonts:build\`.`);
  } else {
    const loader = readFileSync(LOADER, "utf8");
    const referenced = [...loader.matchAll(/\.\.\/fonts\/([\w.-]+\.woff2)/g)].map((m) => m[1]);
    if (referenced.length === 0) problems.push("fonts.ts references no font files at all.");

    /*
     * `newsreader-og.ttf` is referenced by `src/app/opengraph-image.tsx` rather
     * than by the loader — Satori cannot read WOFF2 — so it is checked as a
     * known extra instead of being reported as an orphan.
     */
    const OG_FACE = "newsreader-og.ttf";
    const onDisk = new Set((await readdir(FONT_DIR)).filter((f) => f.endsWith(".woff2")));
    if (!existsSync(path.join(FONT_DIR, OG_FACE))) {
      problems.push(`${OG_FACE} is missing — the Open Graph card would render with no typeface.`);
    }
    for (const file of referenced) {
      if (!onDisk.has(file)) {
        problems.push(`${file} is referenced by fonts.ts but missing. Run \`pnpm fonts:build\`.`);
        continue;
      }
      const buf = readFileSync(path.join(FONT_DIR, file));
      if (buf.toString("ascii", 0, 4) !== "wOF2") {
        problems.push(`${file} is not a WOFF2 file (bad magic number).`);
        continue;
      }
      let covered;
      try {
        covered = decodeWoff2Coverage(buf);
      } catch (error) {
        problems.push(`${file} could not be parsed: ${error.message}`);
        continue;
      }
      const missing = [...REQUIRED].filter((c) => !covered?.has(c.codePointAt(0)));
      if (missing.length) {
        problems.push(`${file} is missing required characters: ${missing.join(" ")}`);
      }
    }
    for (const orphan of onDisk) {
      if (!referenced.includes(orphan)) {
        problems.push(`${orphan} is on disk but not referenced by fonts.ts — delete or wire it up.`);
      }
    }
  }

  if (problems.length) {
    console.error("\n  Font check failed:\n");
    for (const p of problems) console.error(`    - ${p}`);
    console.error("");
    process.exit(1);
  }
  console.log("  fonts: all self-hosted faces present, valid WOFF2, Nordic repertoire complete.");
}

await main();
