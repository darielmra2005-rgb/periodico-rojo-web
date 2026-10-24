# Publicar una noticia municipal

El sitio sigue en Astro, GitHub y Vercel. No requiere un servicio de pago adicional.

1. Copiar `src/content/articles/plantilla-municipal/index.mdx` a una carpeta con el nombre de la nueva nota. Mantener `isDraft: true` mientras se prepara.
2. Redactar el título, descripción y cuerpo con datos verificados de una fuente oficial.
3. Elegir `municipality`: `garcia`, `san-nicolas`, `monterrey`, `escobedo`, `san-pedro` o `guadalupe`.
4. Elegir `category`: `cultura`, `deportes`, `comunidad`, `obras-y-servicios` o `avisos`.
5. Agregar `sourceName` y `sourceUrl` (el enlace de la publicación original, no sólo la página principal). El dominio debe estar autorizado para ese municipio en `src/lib/config/official-sources.ts`; una URL de otro dominio impide publicar la nota, aunque esté marcada como revisada.
6. Cuando haya foto autorizada, guardar el archivo en `src/assets/images/articles/<carpeta>/`, indicar su ruta relativa en `cover`, describirla en `covert_alt` y agregar `photoCredit`. La portada funciona también sin foto.
7. En un próximo evento, agregar `eventDate` en formato ISO con zona horaria, por ejemplo `2026-11-01T18:00:00-06:00`, `eventLocation` y `eventAdmission`. Si se cancela, indicar `eventStatus: "cancelado"`.
8. Revisar la nota y establecer `reviewed: true` e `isDraft: false`. `publishedTime` es la fecha de publicación de la nota, no la del evento. Una fecha futura programa su visibilidad para la siguiente compilación que ocurra después de esa fecha; el sitio estático no se recompila solo.
9. Ejecutar `npm run build` y revisar antes de integrar la rama en `master`.

La portada, las páginas de noticias y RSS usan la misma regla: sólo notas revisadas, no borradores, con municipio, fuente y fecha de publicación no futura. Los artículos originales de ejemplo se conservan en el código, pero no se publican. Los próximos eventos se calculan en el navegador, según la fecha del evento, para que dejen de aparecer como próximos sin recompilar.

## Actualidad y comprobación de las fuentes

Los portales iniciales autorizados son `garcia.gob.mx`, `sanicolas.gob.mx`, `monterrey.gob.mx`, `escobedo.gob.mx`, `sanpedro.gob.mx` y `guadalupe.gob.mx`, con sus variantes `www`. Se comprobaron como portales municipales el 24 de octubre de 2026. Una lista de dominios acredita el origen del enlace; la revisión editorial debe comprobar también el contenido de la publicación original, su fecha, su correspondencia con la nota y las modificaciones o cancelaciones.

Antes de cargar una noticia, abrir el comunicado completo y comprobar la fecha original; la fecha de rastreo del buscador no es la de publicación. Priorizar comunicados recientes y próximos eventos confirmados. Incluir la fecha original en el cuerpo de la nota, sin presentar un anuncio antiguo como si se acabara de realizar. `publishedTime` identifica cuándo lo publicó Periódico Rojo. Si la fuente no permite confirmar un dato, dejarlo pendiente; no completar información mediante suposiciones. Atribuir las cifras y declaraciones al organismo que las comunica.

Las cuentas de redes sociales y los dominios externos no están autorizados automáticamente. Para incorporar una cuenta oficial o un nuevo portal, verificar su vinculación desde el portal municipal y revisar expresamente la lista de fuentes. Las imágenes deben corresponder a la publicación original y llevar su crédito; no usar imágenes generadas para representar sucesos reales.

Esta lista no descarga contenido ni mantiene actualizada la web por sí sola. La recopilación, revisión y publicación de nuevas notas continúan siendo pasos editoriales que deben ejecutarse.

El panel Keystatic existente está configurado para desarrollo local. Esta actualización añade sus campos editoriales, pero no habilita un panel de administración público ni la importación automática de fuentes.
