/**
 * One-shot importer for the Green Ngoria gallery on Pixieset.
 *
 * Downloads each photo at xlarge (1024w) with a real UA + Referer, converts
 * to webp at quality 90, writes to web/public/images/gallery/, and
 * regenerates web/src/config/gallery.ts.
 *
 * Run:   node web/scripts/import-pixieset.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const IDS = [
  '4474a949efc93da7031987299623c2f4',
  '3e8bcf480e6ff1f71940b20e2358e466',
  '48f0a0cd45f0da651fc52ea90ab46831',
  'f390f1e86eec33ebb791b27a25f517c0',
  'cedd0724174c946dbe80b889a9c68b4c',
  'd3e4ea26238b0b105b1111786257dff3',
  '010fc4c6c16499e04b513854c1b1e123',
  'be188203c7481a35b99ce402b71e9f84',
  '4ef5b62711044ac47321883634877199',
  'b667c9758fc006d3399fe3ca77cbc80a',
  'd42e4b31595b9285d14cdbb893dadcac',
  '15ad51b5be449d2d1e428bb0af622d61',
  '5d7737b9c351c738932232ced1865a4f',
  '2774b10b88636ac1966cc39885f15073',
  'd62279f399201ec80c9d6872da7782c7',
  'dc54b24f22efbbb488d472e53dd5604c',
  'db312ea26466d4ac34fd071b32ea33ac',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: 'https://joseacestudios56.pixieset.com/greenngoria/',
  Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, '..');
const OUT_DIR = path.join(WEB, 'public/images/gallery');
const SOURCE_DIR = path.join(OUT_DIR, '_source/pixieset');
const MANIFEST = path.join(WEB, 'src/config/gallery.ts');

async function download(id) {
  const url = `https://images.pixieset.com/674377121/${id}-xlarge.JPG`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(SOURCE_DIR, `${id}.jpg`), buf);
  return buf;
}

async function main() {
  await fs.mkdir(SOURCE_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Purge any existing webp files — the gallery is being replaced entirely.
  for (const name of await fs.readdir(OUT_DIR)) {
    if (name.toLowerCase().endsWith('.webp')) {
      await fs.unlink(path.join(OUT_DIR, name));
    }
  }

  const manifest = [];
  let n = 0;
  for (const id of IDS) {
    n += 1;
    try {
      const buf = await download(id);
      const name = `greenngoria-${String(n).padStart(2, '0')}.webp`;
      const outPath = path.join(OUT_DIR, name);
      await sharp(buf, { failOn: 'none' })
        .rotate()
        .webp({ quality: 90, effort: 6 })
        .toFile(outPath);
      const meta = await sharp(outPath).metadata();
      manifest.push({
        src: `/images/gallery/${name}`,
        width: meta.width ?? 1024,
        height: meta.height ?? 683,
        alt: `Green Ngoria Supplies — Photograph ${n}`,
      });
      console.log(`  OK ${name}  ${meta.width}x${meta.height}`);
    } catch (err) {
      console.error(`  ERR ${id}: ${err.message}`);
    }
  }

  const body =
    `/**\n` +
    ` * Gallery manifest — the photographs shown on /gallery.\n` +
    ` * Sourced from https://joseacestudios56.pixieset.com/greenngoria/.\n` +
    ` * Regenerate by running:  node web/scripts/import-pixieset.mjs\n` +
    ` */\n\n` +
    `export interface GalleryImage {\n` +
    `  src: string;\n  width: number;\n  height: number;\n  alt: string;\n  category?: string;\n}\n\n` +
    `export const galleryImages: GalleryImage[] = ${JSON.stringify(manifest, null, 2)};\n`;
  await fs.writeFile(MANIFEST, body, 'utf8');
  console.log(`\nWrote ${manifest.length} images to gallery manifest.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
