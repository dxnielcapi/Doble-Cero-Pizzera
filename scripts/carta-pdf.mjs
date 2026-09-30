// Saca la carta en PDF para llevarla a imprenta.
//
// El contenido es el mismo de la web —`src/data/menu.ts`, sin una segunda
// copia que se quede vieja— y la composición sigue la de `Menu.astro`: título
// de sección en verde con su filete de oro, nombre en negrita, puntos hasta el
// precio y los ingredientes debajo, más apagados.
//
// Lo dibuja Chrome, que ya está en la máquina, así que no entra ninguna
// dependencia nueva. Todo sale vectorial —ni un píxel: el logotipo es trazado y
// las letras también—, que es lo que hace falta para abrirlo en Illustrator o
// Affinity, escalarlo y mandarlo a imprenta.
//
// Con una salvedad conocida sobre el texto vivo: Caveat entra como fuente
// incrustada y se puede seguir editando como texto, pero Coolvetica es un OTF
// con contornos CFF (`OTTO`) y el escritor de PDF de Chrome no sabe incrustar
// ese sabor, así que la resuelve como fuente Type3: el dibujo es exacto, pero
// llega como contornos y no como texto reescribible. Para todo el trabajo de
// maquetación da igual; si algún día hace falta editarla como texto, basta con
// dejar una versión TrueType de Coolvetica en `public/fonts/` y apuntar ahí.
//
//   npm run carta:pdf

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { SECCIONES, ENTRADILLA, PIE, formatearPrecio } from '../src/data/menu.ts';

const ejecutar = promisify(execFile);
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// La hoja. A4 vertical es la medida de carta más corriente en imprenta; si la
// casa la quiere en otra, se cambia aquí y el resto se recompone solo.
const HOJA = { ancho: '210mm', alto: '297mm', margen: '16mm' };

// La paleta y las tipografías son las de `global.css`. El logotipo es el mismo
// archivo que usa la web, teñido: en papel no hay banda oscura donde ponerlo
// en blanco.
const COLOR = {
  crema: '#f6e9c8',
  tinta: '#1b120c',
  rojo: '#e01b13',
  verde: '#1d3320',
  oro: '#c08a2b',
};

const SALIDA = join(RAIZ, 'impresion', 'carta-doble-cero.pdf');

/* -------------------------------------------------------------------------
   Piezas que hay que meter dentro del HTML

   Todo va incrustado: el HTML se abre desde un archivo suelto y desde ahí
   Chrome no sirve ni las fuentes ni el logotipo por ruta. Además, así el
   intermedio es un único archivo que se puede abrir a mano para ver qué se
   está mandando a imprimir.
------------------------------------------------------------------------- */

const fuente = async (ruta) =>
  `data:font/woff2;base64,${(await readFile(join(RAIZ, ruta))).toString('base64')}`;

const logotipo = async () => {
  const svg = await readFile(join(RAIZ, 'public/doble-cero-logo.svg'), 'utf8');
  // El archivo deja el color a quien lo use; aquí lo pone la carta.
  return svg.replaceAll('currentColor', COLOR.rojo);
};

const escapar = (texto) =>
  String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* -------------------------------------------------------------------------
   La composición
------------------------------------------------------------------------- */

function precio(plato) {
  const variantes = plato.variantes ?? [];
  if (variantes.length) {
    return variantes
      .map(
        ({ etiqueta, precio: importe }) =>
          `<span class="variante"><span class="variante__etiqueta">${escapar(etiqueta)}</span>` +
          `${escapar(formatearPrecio(importe))}</span>`,
      )
      .join('');
  }
  return plato.precio === undefined ? '' : escapar(formatearPrecio(plato.precio));
}

function pintarPlato(plato) {
  // Lo que no se cobra aparte —los toppings, que van incluidos— se queda en el
  // nombre solo: unos puntos que no llevan a ninguna cifra parecen un precio
  // perdido por el camino. Mismo criterio que en la web.
  const cobra = (plato.variantes?.length ?? 0) > 0 || plato.precio !== undefined;

  return [
    `<li class="plato${plato.destacado ? ' plato--destacado' : ''}">`,
    '<p class="linea">',
    `<span class="linea__nombre">${escapar(plato.nombre)}</span>`,
    cobra ? '<span class="linea__puntos"></span>' : '',
    cobra ? `<span class="linea__precio">${precio(plato)}</span>` : '',
    '</p>',
    plato.descripcion ? `<p class="ingredientes">${escapar(plato.descripcion)}</p>` : '',
    plato.etiquetas?.length
      ? `<ul class="etiquetas">${plato.etiquetas
          .map((e) => `<li>${escapar(e)}</li>`)
          .join('')}</ul>`
      : '',
    '</li>',
  ].join('');
}

const pintarSeccion = ({ titulo, entradilla, platos }) =>
  [
    '<section class="seccion">',
    '<div class="rotulo">',
    `<h2>${escapar(titulo)}</h2>`,
    entradilla ? `<p class="nota">${escapar(entradilla)}</p>` : '',
    '</div>',
    `<ul class="lista">${platos.map(pintarPlato).join('')}</ul>`,
    '</section>',
  ].join('');

async function componer() {
  const [coolvetica, caveat, marca] = await Promise.all([
    fuente('public/fonts/coolvetica.woff2'),
    fuente('public/fonts/caveat-latin.woff2'),
    logotipo(),
  ]);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>La carta — Doble Cero</title>
<style>
  @font-face {
    font-family: "Coolvetica";
    src: url("${coolvetica}") format("woff2");
    font-weight: 100 900;
  }

  @font-face {
    font-family: "Caveat";
    src: url("${caveat}") format("woff2");
    font-weight: 600;
  }

  @page {
    size: ${HOJA.ancho} ${HOJA.alto};
    margin: ${HOJA.margen};
  }

  /* Sin esto Chrome se come el crema al imprimir y la carta sale sobre blanco. */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html {
    background: ${COLOR.crema};
  }

  body {
    margin: 0;
    background: ${COLOR.crema};
    color: ${COLOR.tinta};
    font-family: "Coolvetica", system-ui, sans-serif;
    font-size: 10.5pt;
    line-height: 1.35;
  }

  /* ------------------------------------------------------------- Portada */

  .portada {
    text-align: center;
    margin-block-end: 13mm;
  }

  .portada svg {
    width: 62mm;
    height: auto;
  }

  .portada__titulo {
    margin: 6mm 0 0;
    color: ${COLOR.verde};
    font-family: "Caveat", cursive;
    font-weight: 600;
    font-size: 26pt;
    line-height: 1;
  }

  .portada__entradilla {
    margin: 3mm auto 0;
    max-width: 120mm;
    color: ${COLOR.tinta}b0;
    font-size: 10pt;
    line-height: 1.45;
  }

  /* ------------------------------------------------------------ Secciones */

  .seccion {
    margin-block-start: 9mm;
  }

  /* La primera arranca pegada a la portada; el aire ya lo pone ella. */
  .seccion:first-of-type {
    margin-block-start: 0;
  }

  /* Un filete de oro bajo el título separa las secciones sin meter una caja:
     la carta se sigue leyendo como una sola hoja. */
  .rotulo {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 1mm 6mm;
    padding-block-end: 2mm;
    border-block-end: 0.4mm solid ${COLOR.oro}8c;
    margin-block-end: 5mm;
  }

  .rotulo h2 {
    margin: 0;
    color: ${COLOR.verde};
    font-size: 17pt;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.01em;
    text-transform: uppercase;
  }

  .nota {
    margin: 0;
    color: ${COLOR.tinta}9e;
    font-size: 9pt;
    font-style: italic;
  }

  .lista {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* --------------------------------------------------------------- Plato */

  /* Un plato no se parte entre dos páginas: el nombre en una y los
     ingredientes en la siguiente no es una carta, es un descuido. */
  .plato {
    break-inside: avoid;
    margin-block-end: 4.5mm;
  }

  .linea {
    display: flex;
    align-items: baseline;
    gap: 1.2mm;
    margin: 0;
    font-size: 11.5pt;
    font-weight: 700;
  }

  /* Sin encoger: los puntos son quienes ceden el espacio, no el nombre. */
  .linea__nombre {
    flex: 0 1 auto;
  }

  .plato--destacado .linea__nombre {
    color: ${COLOR.rojo};
  }

  /* El relleno de puntos de toda la vida, en borde y no repitiendo el carácter
     «.»: así el sembrado es parejo. Sube un pelo porque la línea de base cae
     por debajo del ojo de la letra. */
  .linea__puntos {
    flex: 1 1 6mm;
    min-width: 6mm;
    translate: 0 -0.28em;
    border-block-end: 0.3mm dotted ${COLOR.tinta}61;
  }

  .linea__precio {
    display: flex;
    flex: 0 0 auto;
    align-items: baseline;
    gap: 3mm;
    white-space: nowrap;
  }

  /* Cada tamaño lleva su nombre encima, en pequeño: dos números seguidos sin
     rótulo no dicen cuál es cuál. */
  .variante {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.15;
  }

  .variante__etiqueta {
    color: ${COLOR.tinta}8c;
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ingredientes {
    margin: 1mm 0 0;
    /* Se corta antes que el precio: la descripción no debe llegar a meterse
       debajo de las cifras. */
    max-width: 92%;
    color: ${COLOR.tinta}ad;
    font-size: 9pt;
    font-weight: 500;
    line-height: 1.4;
    text-wrap: pretty;
  }

  .etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5mm;
    margin: 1.5mm 0 0;
    padding: 0;
    list-style: none;
  }

  .etiquetas li {
    padding: 0.7mm 1.8mm;
    border: 0.3mm solid ${COLOR.verde}59;
    border-radius: 99mm;
    color: ${COLOR.verde};
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1;
    text-transform: uppercase;
  }

  .pie {
    margin-block-start: 10mm;
    padding-block-start: 4mm;
    border-block-start: 0.3mm solid ${COLOR.oro}8c;
    color: ${COLOR.tinta}8c;
    font-size: 8.5pt;
    text-align: center;
  }
</style>
</head>
<body>
  <header class="portada">
    ${marca}
    <h1 class="portada__titulo">La carta</h1>
    ${ENTRADILLA ? `<p class="portada__entradilla">${escapar(ENTRADILLA)}</p>` : ''}
  </header>

  ${SECCIONES.map(pintarSeccion).join('')}

  ${PIE ? `<p class="pie">${escapar(PIE)}</p>` : ''}
</body>
</html>`;
}

/* -------------------------------------------------------------------------
   El dibujado
------------------------------------------------------------------------- */

// Chrome se instala siempre en el mismo par de sitios; Edge sirve igual, que
// es el mismo motor. Se coge el primero que exista.
const CANDIDATOS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const navegador = CANDIDATOS.find((ruta) => existsSync(ruta));
if (!navegador) {
  throw new Error(
    'No encuentro Chrome ni Edge. Apunta a uno con la variable CHROME y repite.',
  );
}

await mkdir(dirname(SALIDA), { recursive: true });

// El HTML intermedio va al lado del PDF y se borra al terminar. Con
// `CONSERVAR_HTML=1` se queda, que es cómodo para ajustar la composición sin
// esperar al rasterizado.
const intermedio = join(dirname(SALIDA), 'carta-doble-cero.html');
await writeFile(intermedio, await componer(), 'utf8');

await ejecutar(navegador, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  // Las fuentes van incrustadas, pero el trazado del logotipo y el reparto en
  // páginas necesitan un respiro antes de que Chrome dé la hoja por cerrada.
  '--virtual-time-budget=6000',
  `--print-to-pdf=${SALIDA}`,
  intermedio,
]);

if (!process.env.CONSERVAR_HTML) await unlink(intermedio);

const { size } = await import('node:fs/promises').then((fs) => fs.stat(SALIDA));
const platos = SECCIONES.reduce((n, s) => n + s.platos.length, 0);
console.log(
  `Carta lista: ${SECCIONES.length} secciones y ${platos} platos ` +
    `en ${(size / 1024).toFixed(0)} KB.\n${SALIDA}`,
);
