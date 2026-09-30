// Genera la imagen que sale en la tarjeta al compartir el enlace.
//
// La foto del horno es vertical (4:5) y las tarjetas no lo son: piden un
// apaisado de 1.91:1. Servir el retrato tal cual es lo que hacía que no
// apareciera nada —X descarta el formato grande por debajo de 1:1, WhatsApp lo
// encoge a un sello— así que aquí se monta sobre un lienzo de 1200x630.
//
// No se recorta: las etiquetas a mano son el contenido de la foto, y un
// apaisado sacado a tijera se lleva por delante la llama o el nombre de la
// pizza. La foto va entera y centrada, y el hueco de los lados lo rellena ella
// misma, desenfocada y apagada, que es más honesto que dos franjas negras.
//
// Sale en JPEG y solo en JPEG: es el único formato que leen todos los que
// rastrean el HTML desde fuera. WhatsApp y LinkedIn aún no abren WebP, y ante
// un `og:image` que no entienden no buscan alternativa, se quedan sin tarjeta.
//
//   npm run assets:og

import sharp from 'sharp';

const SRC = 'src/assets/hero/dob_4.jpg';
const OUT = 'public/Hero/dob_4-og.jpg';

// La medida que recomienda Open Graph y que todos entienden.
const ANCHO = 1200;
const ALTO = 630;

// Un respiro arriba y abajo para que la foto no toque el borde de la tarjeta.
const MARGEN = 20;

const { width, height } = await sharp(SRC).metadata();

const altoFoto = ALTO - MARGEN * 2;
const anchoFoto = Math.round(altoFoto * (width / height));

const fondo = await sharp(SRC)
  .resize(ANCHO, ALTO, { fit: 'cover' })
  .blur(28)
  // Apagado a propósito: el fondo está para no dejar el hueco vacío, no para
  // competir con la foto que lleva encima.
  .modulate({ brightness: 0.45, saturation: 0.7 })
  .toBuffer();

const foto = await sharp(SRC).resize(anchoFoto, altoFoto, { fit: 'contain' }).toBuffer();

await sharp(fondo)
  .composite([{ input: foto, left: Math.round((ANCHO - anchoFoto) / 2), top: MARGEN }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OUT);

console.log(`${OUT}: ${ANCHO}x${ALTO}, con la foto a ${anchoFoto}x${altoFoto}.`);
