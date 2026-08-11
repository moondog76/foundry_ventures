#!/usr/bin/env node
/**
 * Prepares the logo assets supplied by the content owner for web use.
 *
 * Everything this script produces is derived mechanically from files in
 * `assets-supplied/`, and the derivation is deliberately auditable:
 *
 *  1. **Foundry logotype.** `Foundry logo.pdf` is an Illustrator export whose
 *     page box is 355.677 × 134.703 — the exact master geometry recorded in
 *     buildspec Appendix A.1. `pdftocairo -svg` converts it without touching the
 *     outlines. The artwork is a single flat colour, so the white and black
 *     variants are produced by substituting that one fill value and nothing
 *     else; the script then asserts that every `d=` path attribute is byte-identical
 *     across all variants, so a colour change can never smuggle in a geometry
 *     change. The symbol variants reuse the same file with the viewBox narrowed
 *     to the symbol's 77.01 units — SVG clips to the viewBox, so the wordmark is
 *     excluded without editing a single path.
 *
 *     This is NOT the same thing as the five delivered SVG masters. Those remain
 *     preferable and still have their Appendix A.1 hashes recorded; see
 *     `public/brand/README.md`.
 *
 *  2. **Portfolio logos.** Raster and vector logos are copied byte-for-byte to
 *     slug-named paths. `newly.pdf` is an A4 page containing a square logo tile,
 *     so it is rendered and cropped to its own content box.
 *
 * Requires `poppler-utils` (`pdftocairo`) for the two PDF inputs. Everything
 * else runs on Node alone.
 *
 *   node scripts/prepare-supplied-assets.mjs
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const SUPPLIED = path.join(root, "assets-supplied");
const BRAND_OUT = path.join(root, "public/brand");
const PORTFOLIO_OUT = path.join(root, "public/images/portfolio");

const log = (message) => console.log(`  ${message}`);

function requirePdftocairo() {
  const probe = spawnSync("pdftocairo", ["-v"], { encoding: "utf8" });
  if (probe.error) {
    console.error(
      "pdftocairo not found. Install poppler-utils (e.g. `sudo apt-get install -y poppler-utils`).",
    );
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ PNG I/O */

/** Minimal PNG decoder: 8-bit RGBA/RGB/grey, all five scanline filters. */
function decodePng(buffer) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error("only 8-bit PNGs are supported");
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + length;
  }

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported colour type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  let previous = Buffer.alloc(stride);
  let offset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[offset];
    offset += 1;
    const line = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;

    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = previous[x];
      const c = x >= channels ? previous[x - channels] : 0;
      if (filter === 1) line[x] = (line[x] + a) & 255;
      else if (filter === 2) line[x] = (line[x] + b) & 255;
      else if (filter === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }

    line.copy(pixels, y * stride);
    previous = line;
  }

  return { width, height, channels, pixels };
}

function encodePng({ width, height, channels, pixels }) {
  const colorType = { 1: 0, 2: 4, 3: 2, 4: 6 }[channels];
  const stride = width * channels;
  // Filter type 0 per scanline: the artwork is small and deflate handles it.
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "ascii");
    data.copy(out, 8);
    out.writeUInt32BE(
      zlib.crc32(Buffer.concat([Buffer.from(type, "ascii"), data])) >>> 0,
      8 + data.length,
    );
    return out;
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Crops to the bounding box of pixels above an alpha threshold. */
function cropToContent(image, alphaThreshold = 16) {
  const { width, height, channels, pixels } = image;
  if (channels !== 4) return image;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= alphaThreshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return image;

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const out = Buffer.alloc(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    pixels.copy(
      out,
      y * cropWidth * 4,
      ((minY + y) * width + minX) * 4,
      ((minY + y) * width + minX + cropWidth) * 4,
    );
  }
  return { width: cropWidth, height: cropHeight, channels: 4, pixels: out };
}

/** Lossless 90° clockwise rotation — a pure pixel remap, no resampling. */
function rotate90Clockwise({ width, height, channels, pixels }) {
  const out = Buffer.alloc(pixels.length);
  const newWidth = height;
  const newHeight = width;
  for (let y = 0; y < newHeight; y += 1) {
    for (let x = 0; x < newWidth; x += 1) {
      const srcX = y;
      const srcY = height - 1 - x;
      pixels.copy(
        out,
        (y * newWidth + x) * channels,
        (srcY * width + srcX) * channels,
        (srcY * width + srcX + 1) * channels,
      );
    }
  }
  return { width: newWidth, height: newHeight, channels, pixels: out };
}

/* ------------------------------------------------------- Foundry logotype */

/** Every `d="…"` in document order — the geometry fingerprint of a variant. */
function pathData(svg) {
  return (svg.match(/\sd="[^"]*"/g) ?? []).join("\n");
}

function buildFoundryBrand() {
  const source = path.join(SUPPLIED, "Foundry logo.pdf");
  if (!existsSync(source)) {
    log("Foundry logo.pdf not supplied — skipping brand generation");
    return;
  }

  const converted = path.join(BRAND_OUT, "foundry-logo-blue.svg");
  mkdirSync(BRAND_OUT, { recursive: true });

  const result = spawnSync("pdftocairo", ["-svg", source, converted], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`pdftocairo failed: ${result.stderr}`);
    process.exit(1);
  }

  const blue = readFileSync(converted, "utf8");

  // The artwork is one flat colour; anything else means the export changed and
  // a blind substitution would be wrong.
  const colours = [...new Set(blue.match(/rgb\([^)]*\)/g) ?? [])];
  if (colours.length !== 1) {
    console.error(`expected a single flat fill colour, found ${colours.length}: ${colours}`);
    process.exit(1);
  }
  const [sourceColour] = colours;

  /*
   * The PDF exports its blue as rgb(15.5%, 25.9%, 54.9%) — #28428C — which is a
   * CMYK→sRGB conversion artefact rather than the brand blue. The content owner
   * confirmed on 2026-08-11 that #00308F (the `--color-foundry-blue` token) is
   * correct, so the blue variant is normalised to it. Geometry is untouched and
   * the assertion below still proves that.
   */
  const BRAND_BLUE = "rgb(0%,18.823529%,56.078431%)";

  const variants = {
    "foundry-logo-blue.svg": blue.split(sourceColour).join(BRAND_BLUE),
    // §5.1: the black variant deliberately uses #1f1f1f, not absolute black.
    "foundry-logo-black.svg": blue
      .split(sourceColour)
      .join("rgb(12.156863%,12.156863%,12.156863%)"),
    "foundry-logo-white.svg": blue.split(sourceColour).join("rgb(100%,100%,100%)"),
  };

  // The symbol is the leftmost 77.01 units. Narrowing the viewBox clips the
  // wordmark away without editing any path.
  const toIcon = (svg) =>
    svg
      .replace(/viewBox="0 0 355\.677 134\.703"/, 'viewBox="0 0 77.01 134.703"')
      .replace(/width="355\.677"/, 'width="77.01"');

  variants["foundry-icon-blue.svg"] = toIcon(variants["foundry-logo-blue.svg"]);
  variants["foundry-icon-white.svg"] = toIcon(variants["foundry-logo-white.svg"]);

  for (const [name, content] of Object.entries(variants)) {
    writeFileSync(path.join(BRAND_OUT, name), content);
  }

  // Guarantee that only colour and viewBox changed.
  const reference = pathData(blue);
  for (const name of Object.keys(variants)) {
    const variant = readFileSync(path.join(BRAND_OUT, name), "utf8");
    if (pathData(variant) !== reference) {
      console.error(`${name}: path data differs from the source — refusing to ship it`);
      process.exit(1);
    }
  }

  log(`Foundry logotype: 5 variants from ${path.basename(source)} (fill ${sourceColour})`);
  log("geometry verified identical across every variant");
}

/* ------------------------------------------------------- Portfolio logos */

/**
 * Editorial photography supplied by the content owner on 2026-08-11, replacing
 * the Foundry-authored placeholder artwork. Copied byte-for-byte; the crop and
 * focal point live in the content layer, not in the file.
 *
 * `hero-ocean.png` arrived as a screen capture rather than the original export,
 * so it is 1664×1108 where the live site serves 2500×1667. Same 3:2 framing,
 * lower resolution — noted in docs/content-gaps.md.
 */
const EDITORIAL_IMAGES = [
  { slug: "hero-ocean", file: "hero-ocean.png" },
  { slug: "offering-architecture", file: "visualelectric-1736931308116.png" },
  { slug: "offering-silhouette", file: "visualelectric-1737705941785.png" },
];

const PORTFOLIO_LOGOS = [
  { slug: "empley", file: "Empley_large (1).png" },
  { slug: "agaton", file: "Agaton.png" },
  { slug: "grand", file: "Grand Logo Golden glow.png" },
  { slug: "wilgot", file: "wilgot_logo_white_rgb.png" },
  { slug: "openroll", file: "Openroll_Logo_NoTagline_black (kopia).png" },
  { slug: "skattio", file: "skattio.png" },
  { slug: "memmo", file: "memmo.svg" },
  { slug: "builderbase", file: "BuilderBase_Logotype-Primary-Black.png" },
];

function buildPortfolioLogos() {
  mkdirSync(PORTFOLIO_OUT, { recursive: true });

  for (const { slug, file } of PORTFOLIO_LOGOS) {
    const source = path.join(SUPPLIED, file);
    if (!existsSync(source)) {
      log(`${slug}: ${file} not supplied — skipped`);
      continue;
    }
    const target = path.join(PORTFOLIO_OUT, `${slug}${path.extname(file)}`);
    copyFileSync(source, target);
    log(`${slug}: copied ${file} verbatim`);
  }

  // Memmo's SVG is an 810×810 artboard with a 639×98 wordmark floating in the
  // middle, so `object-fit: contain` shrinks it to a fraction of the frame.
  // Narrowing the viewBox to the artwork's own bounding box fixes the optics
  // without touching a single path. The box was measured with the browser's
  // own `SVGGraphicsElement.getBBox()`; re-measure if the file is replaced.
  const memmo = path.join(PORTFOLIO_OUT, "memmo.svg");
  if (existsSync(memmo)) {
    const box = { x: 86.449, y: 356.066, width: 639.461, height: 98.064 };
    const tightened = readFileSync(memmo, "utf8")
      .replace(/viewBox="[^"]*"/, `viewBox="${box.x} ${box.y} ${box.width} ${box.height}"`)
      .replace(/\swidth="1080"/, ` width="${box.width}"`)
      .replace(/\sheight="1080"/, ` height="${box.height}"`);
    writeFileSync(memmo, tightened);
    log(`memmo: viewBox tightened to the artwork (${box.width}×${box.height})`);
  }

  // Newly ships as an A4 page with the square logo tile placed on it.
  const newlySource = path.join(SUPPLIED, "newly.pdf");
  if (existsSync(newlySource)) {
    const tmp = path.join(PORTFOLIO_OUT, "newly-render");
    // 121dpi puts the tile at roughly 1000px, matching the live asset.
    const render = spawnSync(
      "pdftocairo",
      ["-png", "-r", "121", "-transp", "-singlefile", newlySource, tmp],
      { encoding: "utf8" },
    );
    if (render.status !== 0) {
      console.error(`pdftocairo failed for newly.pdf: ${render.stderr}`);
      process.exit(1);
    }
    const rendered = `${tmp}.png`;
    // The tile is placed sideways on the A4 page (the page's own /Rotate is 0,
    // so the artwork itself is rotated); one clockwise quarter-turn sets the
    // wordmark upright again.
    const upright = rotate90Clockwise(cropToContent(decodePng(readFileSync(rendered))));
    writeFileSync(path.join(PORTFOLIO_OUT, "newly.png"), encodePng(upright));
    rmSync(rendered, { force: true });
    log(`newly: rendered from A4 PDF, cropped and rotated to ${upright.width}×${upright.height}`);
  }
}

function buildEditorialImages() {
  const out = path.join(root, "public/images/editorial");
  mkdirSync(out, { recursive: true });

  for (const { slug, file } of EDITORIAL_IMAGES) {
    const source = path.join(SUPPLIED, file);
    if (!existsSync(source)) {
      log(`${slug}: ${file} not supplied — skipped`);
      continue;
    }
    copyFileSync(source, path.join(out, `${slug}${path.extname(file)}`));
    log(`${slug}: copied ${file} verbatim`);
  }
}

/* ----------------------------------------------------------------- Report */

requirePdftocairo();
console.log("Preparing supplied assets\n");
buildFoundryBrand();
buildPortfolioLogos();
buildEditorialImages();

console.log("\nGenerated assets:");
for (const dir of [BRAND_OUT, PORTFOLIO_OUT, path.join(root, "public/images/editorial")]) {
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)
    .filter((n) => !n.endsWith(".md"))
    .sort()) {
    const file = path.join(dir, name);
    const bytes = readFileSync(file);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    console.log(
      `  ${path.relative(root, file).padEnd(46)} ${String(bytes.length).padStart(7)} B  ${hash}`,
    );
  }
}
