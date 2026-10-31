# Seguimiento documental de proyectos

Esta primera entrega añade `/proyectos`, `/proyectos/<slug>` y `/fuentes` al periódico Astro existente. La lista permite buscar, combinar filtros y guardar expedientes en el navegador. Cada expediente conserva eventos, enlaces a documentos, fechas de fuente, fecha del hecho cuando existe respaldo, fecha de incorporación, revisión y asuntos pendientes.

El objetivo de esta etapa es comprobar el recorrido completo de documento a evento y expediente con dos casos municipales ya publicados. No se presenta como el catálogo completo de 69 familias ni como la plataforma OSINT terminada. No incorpora recolectores automáticos, avisos enviados, puntajes de riesgo, mapas prediales, permisos de clientes ni cálculos fiscales.

## Datos y publicación

- `src/data/monitoring/sources.json`: identidad de la fuente, dominios exactos, cobertura, acceso manual y estado de revisión de condiciones de uso.
- `src/data/monitoring/projects.json`: UUID estable, ruta legible, tema, municipio, descripción territorial y pendientes.
- `src/data/monitoring/events.json`: UUID de evento, proyecto, tipo, etapa sustentada, evidencia y revisión. Una fecha de hecho desconocida se mantiene en `null`; no se sustituye por la fecha del comunicado.
- `src/lib/monitoring/catalog.ts`: contrato estricto y validaciones de referencias, fechas, URLs, evidencia y correcciones. Se ejecuta al compilar. La proyección pública se comparte entre listas, fichas, conteos y enlaces a fuentes.

Este repositorio es público. Todos sus archivos son visibles, incluso los registros con `isPublic: false` o revisión pendiente. Esos controles evitan la publicación en la interfaz; **no protegen secretos ni datos privados en GitHub**. No guardar mandatos, expedientes privados, claves API ni información de clientes. La futura parte privada requiere almacenamiento y acceso adecuados antes de incorporar esos datos.

Sólo se genera una ficha pública cuando el proyecto y al menos uno de sus eventos son públicos y el evento tiene revisión completa, evidencia material y fecha de revisión no futura. El sitio se recompila al desplegar; no vigila las fuentes mientras está cerrado. La fecha mexicana limita la publicación por día, sin inventar horas de fuente.

Para incorporar otro proyecto, generar un UUID, elegir un slug único y añadir un documento oficial comprobado. Registrar la fuente antes de enlazarla. Escribir una síntesis propia, un localizador útil y los campos que respalda. `cotejado` significa haber contrastado el contenido del documento, no certificar la ejecución material ni la vigencia jurídica de un proyecto. Identificar correctamente al revisor; los dos registros iniciales declaran revisión asistida por IA. Los actos jurídicos y las futuras alertas críticas requieren revisión especializada.

Las etapas no se deducen de la similitud del texto. Un anuncio permanece como anuncio; una solicitud no se convierte en permiso. Los documentos de progreso permiten registrar lo que el emisor reporta. No atribuir coordenadas, montos o conclusión de obra a partir de información ausente.

## Historial y correcciones

Añadir los nuevos hitos como eventos independientes, conservando el `projectId`. Para corregir un registro, añadir un evento de tipo `correccion` con un UUID nuevo, evidencia, revisión y `supersedesEventId` del registro anterior. No borrar el evento corregido. Una corrección pendiente no sustituye la versión publicada. Las correcciones cruzadas entre proyectos y los ciclos se rechazan. El historial de Git conserva las revisiones de los archivos; esta etapa no implementa todavía el almacenamiento bitemporal completo del documento maestro.

La ficha muestra el último hito documental no sustituido, con las limitaciones de su fecha. Un documento reciente y una revisión reciente son conceptos diferentes. Una corrección editorial no inventa una nueva fecha del hecho.

## Fuentes iniciales y condiciones de uso

Comprobadas el 30 de octubre de 2026:

- Monterrey: [comunicado del Canal Medular del 23 de octubre](https://www.monterrey.gob.mx/noticias/retira-gobierno-de-monterrey-4-mil-toneladas-de-basura-y-escombro-del-canal-medular/).
- General Escobedo: [presentación del Visor Urbano y Geoportal del 22 de octubre](https://escobedo.gob.mx/?a=20261022&p=notas).

Los textos nuevos son síntesis editoriales con enlace y localizador. No se añaden copias íntegras, fotografías ni archivos descargados. No se atribuye una licencia general a un portal por ser oficial; la revisión de reutilización permanece pendiente. El acceso comprobado se refiere a los documentos consultados, no a todos los documentos del portal ni a una API.

## Guardados y costos

La clave `periodico-rojo:project-bookmarks:v1` guarda únicamente los UUID en `localStorage`. La interfaz informa que son guardados de ese navegador, que no generan alertas ni se sincronizan y que pueden desaparecer al borrar los datos. Un fallo de almacenamiento informa el problema sin afirmar que el cambio se guardó.

La entrega no añade dependencias de producción, cuentas, suscripciones ni servicios de datos. Usa Astro y su exportación pública de Zod, ya incluidos en el proyecto. Los límites y condiciones del alojamiento existente siguen aplicando. [Vercel Hobby](https://vercel.com/docs/plans/hobby) se destina a uso personal no comercial; antes del uso comercial debe resolverse un alojamiento compatible y su presupuesto. Este cambio no modifica planes ni facturación.

## Comprobación

Ejecutar `node --experimental-strip-types --test tests/*.test.ts`, `npm run astro -- check` y `npm run build`. Verificar en navegador filtros combinados, cero resultados, guardado y desguardado, persistencia al navegar y recargar, fichas, fuentes, navegación por teclado y disposición móvil. Los datos de prueba sintéticos viven exclusivamente en tests.

## Forma de colaborar

Dariel está aprendiendo desde cero mediante vibe coding. Comenzar las respuestas con una nota breve sobre los conceptos usados en ese paso. Explicar por qué se elige una herramienta, sus condiciones y los costos cuando corresponda. Mantener el aprendizaje junto con el desarrollo, sin convertirlo en un requisito para avanzar. Antes de incorporar un servicio de pago, exponer costo, periodicidad, límites y alternativas; el presupuesto inicial sigue siendo probar sin pagar.
