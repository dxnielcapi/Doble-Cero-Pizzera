// Genera las versiones servibles de las fotos del hero.
//
// Los originales viven en `src/assets/hero/` —fuera de `public/`, así que no se
// publican— y son JPEG grandes: las dos verticales miden 3000x4500 y pesan
// cerca de 900 kB cada una. El hero nunca las muestra a ese tamaño, de modo que
// el navegador se traga megabytes para tirar la mayor parte al escalar.
//
// Este script deja en `public/Hero/` una variante por cada ancho que el
// maquetado puede llegar a pedir —WebP siempre, y AVIF además donde el consumo
// permite elegir formato. Los anchos no son redondeos a ojo, salen de la caja:
// el contenido del hero tiene un tope de 110rem (1760 px) menos los márgenes,
// o sea 1672 px útiles. De ahí sale cada fila de la tabla.
//
//   npm run assets:hero

import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const SRC_DIR = 'src/assets/hero';
const OUT_DIR = 'public/Hero';

const PIEZAS = [
  {
    // Fondo de la sección entera, a sangre y con `cover`. El ancho lo marca la
    // ventana, no la caja de contenido: uno para móvil y otro para escritorio.
    // Calidad baja a propósito —va detrás de todo y siempre recortado.
    nombre: 'Background',
    anchos: [900, 1800],
    calidad: 68,
    // El fondo es el único que se pide desde CSS, donde `image-set()` deja caer
    // el formato sin tocar el marcado: sale a cuenta darle también AVIF. A esta
    // calidad pesa un tercio menos que el WebP y mide algo mejor de fidelidad
    // frente al original, así que no hay nada que sopesar.
    avif: 50,
  },
  {
    // La franja principal es una foto vertical (2:3) metida en una caja de 5:2:
    // solo se ve una rebanada y el resto lo descarta el navegador al recortar.
    // Se recorta aquí, antes de servirla, porque mandar el marco entero es
    // pagar dos tercios de píxeles que se tiran nada más pintarlos.
    //
    // Recortada cabe la resolución que la caja pide de verdad —1672 px útiles,
    // el doble en pantallas 2x— por menos peso del que costaba una versión
    // blanda del marco completo.
    //
    // A cambio, el encuadre vertical se decide aquí y deja de ser un mando de
    // la hoja de estilo: `foco` es lo que antes era `--encuadre-principal`.
    nombre: 'dob_1',
    anchos: [800, 1400, 2100, 2800],
    calidad: 74,
    recorte: { proporcion: 5 / 2, foco: 0.45 },
  },
  // Las tres recomendaciones van en tres columnas de ~525 px, o a una sola
  // columna por debajo de 48rem. 1080 es el ancho del original y cubre el 2x de
  // la columna; 820 es el móvil a 2x y 600 el resto. Calidad más alta que el resto: llevan
  // los rótulos de los platos escritos dentro de la imagen y el WebP agresivo
  // se los come.
  ...['dob_2', 'dob_3', 'dob_4'].map((nombre) => ({
    nombre,
    anchos: [600, 820, 1080],
    calidad: 80,
  })),
];

await mkdir(OUT_DIR, { recursive: true });

let pesoOriginal = 0;
let pesoFinal = 0;

/**
 * Caja de la rebanada que se ve: el ancho entero de la foto y el alto que pide
 * la proporción de destino, colocada según `foco` (0 = arriba, 1 = abajo).
 */
async function caja(ruta, { proporcion, foco }) {
  const { width, height } = await sharp(ruta).metadata();
  const alto = Math.min(height, Math.round(width / proporcion));

  return { left: 0, top: Math.round((height - alto) * foco), width, height: alto };
}

for (const { nombre, anchos, calidad, avif, recorte } of PIEZAS) {
  const desde = `${SRC_DIR}/${nombre}.jpg`;
  const { size: original } = await stat(desde);
  pesoOriginal += original;

  const salidas = [];

  for (const ancho of anchos) {
    const pesos = [];

    for (const formato of avif ? ['avif', 'webp'] : ['webp']) {
      const pieza = sharp(desde);
      if (recorte) pieza.extract(await caja(desde, recorte));

      const info = await pieza
        .resize({ width: ancho, withoutEnlargement: true })
        [formato]({ quality: formato === 'avif' ? avif : calidad, effort: 6 })
        .toFile(`${OUT_DIR}/${nombre}-${ancho}.${formato}`);

      pesoFinal += info.size;
      pesos.push(`${formato} ${(info.size / 1024).toFixed(0)} kB`);
    }

    salidas.push(`${ancho}px ${pesos.join(' / ')}`);
  }

  console.log(
    `${nombre.padEnd(12)} ${(original / 1024).toFixed(0).padStart(4)} kB  →  ` +
      salidas.join('  ·  '),
  );
}

const ahorro = (1 - pesoFinal / pesoOriginal) * 100;

console.log(
  `\n${PIEZAS.length} fotos · ${(pesoOriginal / 1024 / 1024).toFixed(2)} MB` +
    ` → ${(pesoFinal / 1024 / 1024).toFixed(2)} MB en todas las variantes` +
    ` (${ahorro.toFixed(0)} % menos)`,
);
