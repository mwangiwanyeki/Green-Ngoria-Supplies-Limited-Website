/**
 * Import Pixieset originals extracted from the ZIP the user downloaded.
 *
 * - Reads every image under $SOURCE (recursively).
 * - Computes a dHash for each, and for every photo already in
 *   web/public/images/gallery/*.webp, so near-duplicates are dropped.
 * - Anything new is re-encoded to webp @ q90 at ORIGINAL resolution and
 *   added to web/src/config/gallery.ts.
 *
 * Run:  node web/scripts/import-pixieset-zip.mjs <source-dir>
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, '..');
const GALLERY = path.join(WEB, 'public/images/gallery');
const MANIFEST = path.join(WEB, 'src/config/gallery.ts');
const SOURCE = process.argv[2];

if (!SOURCE) {
  console.error('Usage: node web/scripts/import-pixieset-zip.mjs <source-dir>');
  process.exit(1);
}

const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.heic', '.avif']);
const DHASH_THRESHOLD = 10; // Hamming distance ≤ 10 = treated as duplicate.

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (EXTS.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function dhash(input) {
  const { data } = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += data[y * 9 + x + 1] > data[y * 9 + x] ? '1' : '0';
    }
  }
  return bits;
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

function safeSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'photo';
}

async function nextFreeName(base) {
  const files = new Set(await fs.readdir(GALLERY));
  let name = `${base}.webp`;
  let n = 1;
  while (files.has(name)) {
    n += 1;
    name = `${base}-${n}.webp`;
  }
  return name;
}

async function readManifest() {
  const src = await fs.readFile(MANIFEST, 'utf8');
  const m = src.match(/export const galleryImages: GalleryImage\[\] = (\[[\s\S]*?\]);/);
  if (!m) throw new Error('Cannot parse gallery.ts');
  return JSON.parse(m[1]);
}

async function writeManifest(entries) {
  const body =
    `/**\n` +
    ` * Gallery manifest — the photographs shown on /gallery.\n` +
    ` * Sourced from https://joseacestudios56.pixieset.com/greenngoria/.\n` +
    ` * Extend with:  node web/scripts/import-pixieset-zip.mjs <folder>\n` +
    ` */\n\n` +
    `export interface GalleryImage {\n` +
    `  src: string;\n  width: number;\n  height: number;\n  alt: string;\n  category?: string;\n}\n\n` +
    `export const galleryImages: GalleryImage[] = ${JSON.stringify(entries, null, 2)};\n`;
  await fs.writeFile(MANIFEST, body, 'utf8');
}

async function main() {
  console.log(`Scanning ${SOURCE} …`);
  const sources = await walk(SOURCE);
  console.log(`  found ${sources.length} source files`);

  const existingHashes = [];
  const existingFiles = (await fs.readdir(GALLERY)).filter((f) => f.toLowerCase().endsWith('.webp'));
  for (const f of existingFiles) {
    existingHashes.push({ name: f, hash: await dhash(path.join(GALLERY, f)) });
  }
  console.log(`  ${existingHashes.length} photos already in gallery`);

  const manifest = await readManifest();
  const knownSrcs = new Set(manifest.map((e) => e.src));
  const newHashes = [...existingHashes]; // dedupe within the new batch too

  let added = 0;
  let skippedDup = 0;
  let skippedIntra = 0;

  for (const src of sources) {
    const h = await dhash(src);

    // Duplicate of an existing gallery photo?
    const dupExisting = existingHashes.find((e) => hamming(e.hash, h) <= DHASH_THRESHOLD);
    if (dupExisting) {
      skippedDup += 1;
      continue;
    }
    // Duplicate of something we already imported in THIS run?
    const dupIntra = newHashes
      .slice(existingHashes.length)
      .find((e) => hamming(e.hash, h) <= DHASH_THRESHOLD);
    if (dupIntra) {
      skippedIntra += 1;
      continue;
    }

    const base = safeSlug(path.basename(src, path.extname(src)));
    const outName = await nextFreeName(base);
    const outPath = path.join(GALLERY, outName);
    await sharp(src, { failOn: 'none' })
      .rotate()
      .webp({ quality: 90, effort: 6 })
      .toFile(outPath);
    const meta = await sharp(outPath).metadata();
    manifest.push({
      src: `/images/gallery/${outName}`,
      width: meta.width ?? 1600,
      height: meta.height ?? 1067,
      alt: `Green Ngoria Supplies — ${path.basename(src, path.extname(src))}`,
    });
    knownSrcs.add(`/images/gallery/${outName}`);
    newHashes.push({ name: outName, hash: h });
    added += 1;
    if (added % 10 === 0) console.log(`  … imported ${added} so far`);
  }

  await writeManifest(manifest);
  console.log(
    `\nDone. Added ${added} new photos; skipped ${skippedDup} duplicates already in gallery; skipped ${skippedIntra} duplicates within this batch. Gallery total = ${manifest.length}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
