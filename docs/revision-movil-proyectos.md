# Revisión móvil de Proyectos y Fuentes

## Problemas corregidos

En pantallas pequeñas, los filtros Municipio y Tema compartían una fila y recortaban opciones largas. Ahora se apilan hasta 640 px, muestran texto de 16 px y tienen al menos 48 px de alto. Cada selector tiene un nombre accesible explícito.

La navegación horizontal dejaba varios municipios fuera de vista. Hasta 900 px, Portada, Proyectos y Fuentes permanecen visibles y los municipios aparecen en un desplegable nativo `details/summary`. Funciona sin JavaScript, permite navegación con teclado e identifica el municipio actual. Los enlaces municipales tienen al menos 48 px de alto. En escritorio se conserva la barra de enlaces.

Hasta 480 px, Abrir expediente y Guardar proyecto ocupan filas completas para facilitar su uso táctil. Los controles de restablecer filtros y sólo guardados tienen al menos 44 px de alto.

## Verificación

Se revisaron `/proyectos`, los dos expedientes publicados y `/fuentes` en marcos de navegador de 320, 390, 768 y 1280 px. En las 16 combinaciones, el ancho del documento coincidió con el área disponible, sin desbordamiento horizontal. Las barras de desplazamiento de escritorio restan 15 px al área interior de cada marco.

Se comprobaron estos recorridos en la vista móvil:

- Nombre completo de San Nicolás de los Garza en el filtro más estrecho.
- Filtros combinados de texto, municipio y tema; mensaje sin resultados; restablecimiento.
- Conservación de filtros mediante la URL después de recargar.
- Guardar un expediente, filtrar guardados, abrir su ficha y conservar el guardado.
- Quitar el guardado desde la ficha, volver a la lista y comprobar que ya no aparece entre los guardados.
- Abrir el menú con Enter, avanzar con Tab al primer municipio y navegar a San Nicolás de los Garza.
- Conservación del historial, las fechas y los enlaces a documentos oficiales.

Las 43 pruebas de datos, publicación y clima pasaron. `npm run build` generó correctamente las 40 páginas del sitio. `astro check` no encontró errores; conserva una sugerencia preexistente por el uso de `document.execCommand` en el componente de compartir.

Esta verificación usa Chromium con anchos de página controlados; no sustituye una prueba física en Safari/iPhone o Android. No se añadieron dependencias, cuentas ni servicios de pago.

## Continuidad

Esta entrega termina la revisión adaptable pendiente de la primera versión de seguimiento. La carga de evidencia continúa siendo manual. El siguiente bloque funcional es preparar la incorporación y revisión de nuevos documentos oficiales, manteniendo la relación entre fuente, evento y expediente y la separación entre declaraciones y hechos acreditados.
