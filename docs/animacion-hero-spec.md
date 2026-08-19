# Spec: Hero con zoom-out ligado al scroll

Referencia visual reconstruida a partir de una captura de secuencia. Este documento
es la fuente de verdad — las imágenes de referencia (si se adjuntan) solo confirman
el look, no la mecánica.

---

## 1. Concepto

Sección hero fijada (pinned) donde un collage de imágenes arranca en un zoom
extremo y se **reduce progresivamente hasta su escala real** conforme el usuario
hace scroll. Al final del recorrido queda visible la composición completa:
collage centrado, bloques de color de fondo y el titular en tipografía outline.

La sensación es la de una cámara que retrocede: al inicio solo se ve textura
(el borde de un tazón, un fragmento del vaso), y al final se entiende que todo
eso era una pieza de un cartel.

---

## 2. Estados clave

### Estado A — progreso 0
- Escala del collage: ~8–10x
- Solo es legible una fracción del centro de la composición (borde inferior de
  dos tazones); el resto del viewport es fondo crema vacío.
- Los bloques de color y la tipografía **no** son visibles (están detrás y muy
  fuera de encuadre).

### Estado B — progreso ~0.55
- Escala: ~3x
- Ya se distingue el objeto central completo (vaso alto con rodaja de cítrico
  encima) y los tazones a ambos lados.
- Todavía no aparece nada de la capa de fondo.

### Estado C — progreso ~0.7
- Escala: ~2x
- **Primer momento en que asoma una esquina de un bloque de color** en el borde
  del encuadre. Este es el beat de la animación: el usuario descubre que hay
  otra capa detrás.

### Estado D — progreso 1
- Escala: 1x
- Composición final: dos bloques rectangulares de color sólido en la mitad
  superior, titular outline gigante cruzando horizontalmente, collage centrado
  y superpuesto encima del titular, tarjetas de navegación en el borde inferior.

---

## 3. Mecánica

- **Trigger:** scroll. Sección pinned durante el recorrido.
- **Distancia de scroll:** ~200vh (ajustable; con menos se siente brusco, con
  más se vuelve tedioso).
- **Scrub:** ligado 1:1 al scroll, con smoothing suave (~0.5–1s de lag) para
  que no se sienta mecánico en trackpad.
- **Easing:** el zoom NO es lineal. Debe desacelerar hacia el final —
  `power2.out` o equivalente. El tramo de escala 10x→4x pasa rápido; el tramo
  final 2x→1x es donde el usuario tiene tiempo de leer la composición.
- **transform-origin:** centrado en el objeto principal del collage (el vaso),
  no en el centro geométrico del contenedor. Es lo que hace que el zoom se
  sienta "hacia un punto" y no genérico.
- **Punto de anclaje vertical:** el origen está ligeramente por debajo del
  centro del viewport, de modo que en el estado A el contenido queda recortado
  por arriba.

---

## 4. Capas y parallax

De atrás hacia adelante:

1. **Fondo:** color crema plano, siempre estático. No escala.
2. **Bloques de color:** dos rectángulos sólidos. Escalan con el grupo pero a
   un factor menor (~0.85 del factor del collage) — esto produce el parallax.
3. **Titular outline:** tipografía sin relleno, solo contorno fino. Escala junto
   con los bloques.
4. **Collage — capa trasera:** elementos periféricos (tazones secundarios,
   fragmentos de fondo).
5. **Collage — capa frontal:** objeto principal (vaso) + tazón inmediato.
   Escala a un factor ligeramente mayor (~1.1x del grupo).
6. **Tarjetas de navegación:** aparecen solo al final, sin escalado propio;
   pueden entrar con un fade + translate Y en el último 15% del progreso.

Si el parallax por capas complica demasiado la primera versión, hacer todo con
un solo `scale` sobre el contenedor y añadir las capas después. El efecto base
ya funciona sin parallax.

---

## 5. Dirección de arte

- **Fondo:** crema / hueso cálido.
- **Acento:** azul cobalto saturado (bloques + tipografía).
- **Imágenes:** recortes fotográficos tratados con trama de semitono visible
  (puntos CMYK), grano y saturación alta. Estética de impresión offset retro.
  Este tratamiento va aplicado en las imágenes fuente, no en CSS.
- **Tipografía titular:** sans geométrica, peso alto, renderizada en outline
  (solo stroke, sin fill), tamaño desbordado — el titular se corta contra los
  bordes del viewport.
- **Composición:** los recortes se superponen al titular y a los bloques,
  rompiendo la retícula deliberadamente.

---

## 6. Implementación sugerida

Opción A — GSAP ScrollTrigger (más control, mejor cross-browser):
- `ScrollTrigger` con `pin: true`, `scrub: 1`, `end: "+=200%"`.
- Un timeline con el `scale` del contenedor y los factores por capa.
- `will-change: transform` en los contenedores animados.

Opción B — CSS scroll-driven animations (`animation-timeline: scroll()`):
- Sin dependencias, pero soporte de navegador más limitado y menos control
  sobre el scrub.

En ambos casos:
- Animar **solo** `transform`. Nada de `width`, `top` ni `background-size`.
- Imágenes exportadas en WebP; el collage escalado a 10x necesita resolución
  suficiente para no pixelarse en el estado A.
- Respetar `prefers-reduced-motion`: saltar directo al estado D.

---

## 7. Criterios de aceptación

- [ ] La sección se mantiene fija durante todo el recorrido, sin saltos al
      entrar ni al salir del pin.
- [ ] En el estado inicial no hay ningún indicio visual de los bloques de color.
- [ ] La primera aparición de color ocurre pasado el 65% del progreso.
- [ ] El zoom desacelera de forma perceptible en el tramo final.
- [ ] Scroll inverso reproduce la animación en reversa sin artefactos.
- [ ] 60fps en un scroll continuo; sin repaints fuera de la capa compuesta.
- [ ] En viewport móvil la composición final sigue siendo legible (el titular
      puede recortarse, pero el collage no debe quedar fuera de pantalla).
