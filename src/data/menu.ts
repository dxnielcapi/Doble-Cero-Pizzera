/**
 * La carta — Doble Cero
 *
 * ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE TOCAR PARA CAMBIAR EL MENÚ.
 * El componente `src/components/Menu.astro` se limita a pintar lo que haya
 * aquí: añade, quita o reordena secciones y platos y la página se rehace sola.
 *
 * El contenido viene de `menu_doble_cero.json`, que se queda como fuente. Al
 * volcarlo se corrigieron acentos y erratas evidentes (marcas incluidas) y los
 * nombres pasaron de VERSALES a caja normal; el resto del texto va tal cual.
 */

/** Un precio con nombre, para lo que se vende en varios tamaños. */
export interface Variante {
  /** 'Chica', 'Mediana', 'Familiar', 'Copa', 'Botella'… */
  etiqueta: string;
  precio: number;
}

export interface Plato {
  nombre: string;
  /** Los ingredientes, en una línea. Opcional: hay platos que no la necesitan. */
  descripcion?: string;
  /**
   * Precio único. Si el plato tiene tamaños, usa `variantes` en su lugar.
   * Déjalo sin poner para lo que no se cobra aparte —los toppings—: la línea
   * se pinta entonces sin puntos ni cifra.
   */
  precio?: number;
  /** Varios precios para el mismo plato. Manda sobre `precio` si están los dos. */
  variantes?: Variante[];
  /** Distintivos cortos: 'vegetariana', 'picante', 'nuevo'… */
  etiquetas?: string[];
  /** La casa la recomienda: se pinta el nombre en rojo. */
  destacado?: boolean;
}

export interface Seccion {
  /** Ancla de la URL y del índice. Sin espacios ni acentos: 'pizzas', 'bebidas'. */
  id: string;
  titulo: string;
  /** Una línea de contexto bajo el título. Opcional. */
  entradilla?: string;
  platos: Plato[];
}

/* ---------------------------------------------------------------------------
   Moneda
   Cambia el par local/código si la carta no va en pesos mexicanos. Sin
   decimales a propósito: en una carta impresa los céntimos sobran.
--------------------------------------------------------------------------- */
const formateador = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatearPrecio = (importe: number) => formateador.format(importe);

/* ---------------------------------------------------------------------------
   El contenido
--------------------------------------------------------------------------- */

/**
 * Va bajo el título de la carta, antes de la primera sección. Vacía porque el
 * JSON no traía ningún texto de presentación: la nota de las pizzas es de las
 * pizzas y vive en su sección. En cuanto haya un par de líneas, aquí van.
 */
export const ENTRADILLA = '';

export const SECCIONES: Seccion[] = [
  {
    id: 'pizzas',
    titulo: 'Pizzas',
    entradilla: 'Todas nuestras pizzas miden 32 cm de diámetro aprox.',
    platos: [
      {
        nombre: 'Pizza Margarita',
        descripcion: 'Salsa de tomate, Albahaca y Queso Mozzarella.',
        precio: 169,
      },
      {
        nombre: 'Pizza Quattro Stagioni',
        descripcion:
          'Salsa de tomate, Queso Mozzarella, Champiñón, Aceituna Negra, Jamón, Pimiento Morrón y Parmesano.',
        precio: 199,
      },
      {
        nombre: 'Pizza Boscaiola',
        descripcion:
          'Salsa de tomate, Queso Mozzarella, Champiñones preparados de la casa y Aceitunas Negras, con una cobertura de Queso Parmesano.',
        precio: 199,
      },
      {
        nombre: 'Pizza Ahumada Suprema',
        descripcion:
          'Salsa de tomate, Queso Mozzarella, Parmesano, Tocino, Cebolla Caramelizada y Miel con Habanero.',
        precio: 229,
      },
      {
        nombre: 'Pizza La Rojita',
        descripcion:
          'Salsa de tomate, Queso Mozzarella, Chorizo, Peperoni, Pimiento Rojo y Rajas.',
        precio: 229,
      },
      {
        nombre: 'Pizza Piña Sunset',
        descripcion:
          'Salsa de tomate, Queso Mozzarella, Piña Ahumada, Jamón, Cebolla Morada y Tocino.',
        precio: 229,
      },
      {
        nombre: 'Pizza Peperoni',
        descripcion: 'Salsa de tomate, Queso Mozzarella, Parmesano y Peperoni.',
        precio: 179,
      },
    ],
  },
  {
    id: 'postres',
    titulo: 'Postres',
    platos: [
      {
        nombre: 'Barquillo Ahumado',
        descripcion:
          'Tibias manzanas caramelizadas lentamente en mantequilla y canela, envueltas en nuestra masa de pizza dorada y horneada en forma de paste. Coronado con cremoso helado de vainilla y terminado con salsa de chocolate.',
        precio: 110,
      },
      {
        nombre: 'Dulce Tentazione',
        descripcion:
          'Nuestra masa de pizza recién horneada, cubierta generosamente con una base de Nutella cremosa. Y combinación de plátano y fresa con nuez espolvoreada.',
        precio: 179,
      },
      {
        nombre: 'Pizza Frutti di Bosco',
        descripcion:
          'Base de mermelada de frutos rojos artesanal de dulzor equilibrado, coronada con suaves perlas de queso crema y trozos crujientes de galleta de vainilla tostada. Finalizada al centro con un corazón de bombones gratinados al momento.',
        precio: 169,
      },
    ],
  },
  {
    id: 'bebidas',
    titulo: 'Bebidas',
    platos: [
      {
        nombre: 'Clericot 1 litro',
        descripcion:
          'Vino Merlot con agua mineral y refresco de sabor, servido con hielo y frutas frescas en trozos: manzana y fresa.',
        precio: 169,
      },
      { nombre: 'Copa de Clericot (300 ml)', precio: 89 },
      {
        nombre: 'Aperol Spritz 1 lt',
        descripcion:
          'Aperol®, vino espumoso Cinzano®, hielo y frutas frescas en trozos: naranja y cerezas.',
        precio: 199,
      },
      { nombre: 'Copa de Aperol (375 ml)', precio: 135 },
      { nombre: 'Coca-Cola (355 ml)', precio: 35 },
      { nombre: 'Agua mineral (350 ml)', precio: 35 },
      { nombre: 'Cerveza Stella Artois (330 ml)', precio: 45 },
    ],
  },
  {
    id: 'toppings',
    titulo: 'Toppings',
    entradilla: 'A elegir 2 por pizza.',
    // Sin precio: van incluidos, así que la línea sale sin puntos ni cifra.
    platos: [
      { nombre: 'Chimichurri' },
      { nombre: 'Rajas' },
      { nombre: 'Miel con habanero' },
      { nombre: 'Mix de chiles secos' },
    ],
  },
];

/** Pie de la carta: alérgenos, propina, horarios… Deja la cadena vacía para ocultarlo. */
export const PIE = '';
