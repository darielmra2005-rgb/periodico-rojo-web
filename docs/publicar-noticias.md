# Publicar una noticia municipal

El sitio sigue en Astro, GitHub y Vercel. No requiere un servicio de pago adicional.

1. Copiar `src/content/articles/plantilla-municipal/index.mdx` a una carpeta con el nombre de la nueva nota. Mantener `isDraft: true` mientras se prepara.
2. Redactar el título, descripción y cuerpo con datos verificados de una fuente oficial.
3. Elegir `municipality`: `garcia`, `san-nicolas`, `monterrey`, `escobedo`, `san-pedro` o `guadalupe`.
4. Elegir `category`: `cultura`, `deportes`, `comunidad`, `obras-y-servicios` o `avisos`.
5. Agregar `sourceName` y `sourceUrl` (el enlace de la publicación original, no sólo la página principal).
6. Cuando haya foto autorizada, guardar el archivo en `src/assets/images/articles/<carpeta>/`, indicar su ruta relativa en `cover`, describirla en `covert_alt` y agregar `photoCredit`. La portada funciona también sin foto.
7. En un próximo evento, agregar `eventDate` en formato ISO con zona horaria, por ejemplo `2026-11-01T18:00:00-06:00`, `eventLocation` y `eventAdmission`. Si se cancela, indicar `eventStatus: "cancelado"`.
8. Revisar la nota y establecer `reviewed: true` e `isDraft: false`. `publishedTime` es la fecha de publicación de la nota, no la del evento. Una fecha futura programa su visibilidad para la siguiente compilación que ocurra después de esa fecha; el sitio estático no se recompila solo.
9. Ejecutar `npm run build` y revisar antes de integrar la rama en `master`.

La portada, las páginas de noticias y RSS usan la misma regla: sólo notas revisadas, no borradores, con municipio, fuente y fecha de publicación no futura. Los artículos originales de ejemplo se conservan en el código, pero no se publican. Los próximos eventos se calculan en el navegador, según la fecha del evento, para que dejen de aparecer como próximos sin recompilar.

El panel Keystatic existente está configurado para desarrollo local. Esta actualización añade sus campos editoriales, pero no habilita un panel de administración público ni la importación automática de fuentes.
