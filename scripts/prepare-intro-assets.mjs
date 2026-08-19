// Genera versiones recortadas y ligeras de los assets de intro.
//
// Los originales de `public/assets_intro/` son planchas de 4500x3000 con el
// motivo centrado y el resto transparente: el recorte ocupa entre un 3% y un
// 33% del lienzo. Servirlas tal cual a la cortina significa decodificar 13,5 MP
// por pieza y colocar cajas casi vacías en una retícula. Este script recorta
// cada una a su caja alfa y la reescala, dejando el resultado en `derived/`.
//
// Los originales no se tocan: el hero los seguirá usando a resolución completa
// para aguantar el zoom 10x.
//
//   npm run assets:intro

import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';

const SRC_DIR = 'public/assets_intro';
const OUT_DIR = 'public/assets_intro/derived';

const ANCHO_DESTINO = 780;
const UMBRAL_ALFA = 12;
const MARGEN = 8; // px del original, para no comerse el borde con antialias

/** Caja delimitadora de los píxeles con alfa por encima del umbral. */
async function cajaAlfa(ruta) {
  const { data, info } = await sharp(ruta)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] <= UMBRAL_ALFA) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error(`${ruta}: no hay píxeles opacos`);

  const left = Math.max(0, minX - MARGEN);
  const top = Math.max(0, minY - MARGEN);

  return {
    left,
    top,
    width: Math.min(width - left, maxX - minX + 1 + MARGEN * 2),
    height: Math.min(height - top, maxY - minY + 1 + MARGEN * 2),
  };
}

await mkdir(OUT_DIR, { recursive: true });

const fuentes = (await readdir(SRC_DIR))
  .filter((nombre) => nombre.endsWith('.webp'))
  .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

let total = 0;

for (const nombre of fuentes) {
  const desde = `${SRC_DIR}/${nombre}`;
  const caja = await cajaAlfa(desde);

  const info = await sharp(desde)
    .extract(caja)
    .resize({ width: ANCHO_DESTINO, withoutEnlargement: true })
    .webp({ quality: 58, effort: 6 })
    .toFile(`${OUT_DIR}/${nombre}`);

  total += info.size;

  console.log(
    `${nombre.padEnd(15)} recorte ${caja.width}x${caja.height}` +
      ` → ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} kB`,
  );
}

console.log(`\n${fuentes.length} piezas · ${(total / 1024).toFixed(0)} kB en total`);
