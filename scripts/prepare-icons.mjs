// Genera los iconos de la marca a partir del logo.
//
// El favicon que traía la plantilla era el de Astro. Este script lo sustituye
// por el logo de la casa, pero no lo usa tal cual: el logotipo viene en el rojo
// de la marca y sobre una pestaña clara pierde fuerza. Aquí se pinta en blanco
// sobre un cuadrado del tinta de la marca, que es lo que se ve bien en los dos
// temas.
//
// Deja tres piezas, todas del mismo dibujo:
//
//   favicon.svg          — el que usan los navegadores modernos
//   favicon.ico          — para los que aún piden `/favicon.ico` a pelo
//   apple-touch-icon.png — el icono de la pantalla de inicio en iOS
//
//   npm run assets:icons

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const LOGO = 'public/doble-cero-logo.svg';
const TINTA = '#1b120c';

// La caja del logo, tal como la declara su propio `viewBox`.
const LOGO_CAJA = { x: 115, y: 97, ancho: 4529, alto: 3055 };

// El lienzo cuadrado del icono y cuánto ocupa el logo dentro. El margen no es
// coquetería: a 32 px el dibujo se come las esquinas redondeadas si llega al
// borde, y iOS recorta por su cuenta.
const LIENZO = 512;
const ANCHO_LOGO = 392;

const alto = Math.round(LOGO_CAJA.alto * (ANCHO_LOGO / LOGO_CAJA.ancho));
const x = Math.round((LIENZO - ANCHO_LOGO) / 2);
const y = Math.round((LIENZO - alto) / 2);

// Del logo solo interesa su contenido: se le quita el `<svg>` de fuera para
// poder anidarlo con su `viewBox` intacto y que el escalado lo haga el
// navegador, sin tocar un solo trazado.
const fuente = await readFile(LOGO, 'utf8');
// El archivo deja el color al gusto de quien lo use (`currentColor`, que en la
// web resuelven la barra y el pie). Aquí no hay de quién heredarlo: se fija el
// blanco a mano antes de rasterizar.
const dibujo = fuente
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replaceAll('currentColor', '#fff');

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LIENZO} ${LIENZO}">` +
  `<rect width="${LIENZO}" height="${LIENZO}" rx="104" fill="${TINTA}"/>` +
  `<svg viewBox="${LOGO_CAJA.x} ${LOGO_CAJA.y} ${LOGO_CAJA.ancho} ${LOGO_CAJA.alto}"` +
  ` x="${x}" y="${y}" width="${ANCHO_LOGO}" height="${alto}">${dibujo}</svg>` +
  `</svg>`;

await writeFile('public/favicon.svg', svg);

// `density` alta antes de rasterizar: si no, sharp dibuja el SVG a 72 ppp y
// luego lo estira, y los remates del logo salen con el borde sucio.
const lienzo = () => sharp(Buffer.from(svg), { density: 600 });

await lienzo().resize(180, 180).png().toFile('public/apple-touch-icon.png');

// Un ICO que envuelve un PNG, que es lo que entiende todo lo que sigue pidiendo
// `/favicon.ico`. La cabecera son 6 bytes de directorio y 16 de entrada; el PNG
// va detrás, en el desplazamiento 22.
const png = await lienzo().resize(32, 32).png({ compressionLevel: 9 }).toBuffer();

const directorio = Buffer.alloc(6);
directorio.writeUInt16LE(0, 0); // reservado
directorio.writeUInt16LE(1, 2); // tipo: icono
directorio.writeUInt16LE(1, 4); // una sola imagen

const entrada = Buffer.alloc(16);
entrada[0] = 32; // ancho
entrada[1] = 32; // alto
entrada.writeUInt16LE(1, 4); // planos
entrada.writeUInt16LE(32, 6); // bits por píxel
entrada.writeUInt32LE(png.length, 8);
entrada.writeUInt32LE(22, 12);

await writeFile('public/favicon.ico', Buffer.concat([directorio, entrada, png]));

console.log(`Iconos listos: logo de ${ANCHO_LOGO}x${alto} centrado en ${LIENZO}x${LIENZO}.`);
