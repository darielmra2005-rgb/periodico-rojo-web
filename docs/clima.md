# Pronóstico municipal

El bloque de portada y ediciones municipales consulta `/api/clima?municipio=monterrey` al acercarse a la pantalla. El selector permite consultar los seis municipios y sigue los cambios del filtro de noticias. No pide ubicación ni transmite coordenadas personales.

La función de Vercel consulta Locationforecast 2.0 de **MET Norway**, organismo meteorológico público de Noruega, con cobertura mundial. En México es un pronóstico automático basado en modelos, no una observación de estación ni un aviso del SMN. Se conservan las noticias exclusivamente de fuentes municipales oficiales. El bloque de clima tiene atribución propia, licencia CC BY 4.0 y enlace al SMN para avisos nacionales.

Cada municipio usa un punto aproximado de la cabecera (coordenadas en `src/lib/weather/forecast.ts`). La resolución del modelo global es aproximadamente 9 km: municipios cercanos pueden compartir valores, y no representa diferencias entre todas las colonias o montañas. No se crean diferencias artificiales.

Se muestran temperatura estimada para la hora indicada, viento previsto, rango de temperaturas de los intervalos disponibles y siete días, incluido hoy. Hoy contiene únicamente las horas disponibles desde la hora actual. La fecha usa America/Monterrey. Los acumulados de precipitación se suman por día local, utilizando intervalos de una hora cuando existen y de seis horas a largo plazo, sin sumar periodos superpuestos. Se muestran extremos de temperatura de seis horas cuando están disponibles. Una descripción de lluvia o tormenta señala que aparece en al menos un periodo del día, no que durará todo el día. Los milímetros **no** se convierten en una probabilidad. Si faltan intervalos de precipitación se muestra dato incompleto; cero sólo se muestra si todos los intervalos necesarios están presentes.

El servicio se identifica con el dominio y repositorio público del periódico. Sólo acepta seis municipios predefinidos, con URL de origen fija y límite de espera de diez segundos. No necesita cuenta, clave ni paquete adicional. La caché en memoria respeta Expires y al menos tres horas entre consultas por municipio; reutiliza Last-Modified mediante If-Modified-Since y agrupa consultas simultáneas en una instancia. Vercel conserva respuestas válidas hasta tres horas, con vencimiento adicional a medianoche local. La caché en memoria no es persistente entre instancias. Ante crecimiento considerable de tráfico convendrá una caché compartida.

El navegador vuelve a consultar como máximo cada treinta minutos mientras el bloque está cerca de la pantalla y la pestaña visible. Los datos se rechazan si la actualización del modelo supera doce horas, si no hay un intervalo cercano a la hora actual o si faltan días consecutivos. Ante errores se muestra indisponibilidad, sin sustituir cifras ni mostrar datos viejos como nuevos. No hay tareas programadas ni llamadas cuando el sitio está cerrado.

Referencias consultadas el 24 de octubre de 2026:

- [API y cobertura](https://api.met.no/)
- [Modelo, parámetros y resolución](https://docs.api.met.no/doc/locationforecast/datamodel.html)
- [Formato temporal](https://docs.api.met.no/doc/ForecastJSON.html)
- [Frecuencia y recomendaciones](https://docs.api.met.no/doc/locationforecast/FAQ.html)
- [Condiciones del servicio](https://docs.api.met.no/doc/TermsOfService.html)
- [Licencia y atribución](https://docs.api.met.no/doc/License.html)
- [Funciones Node de Vercel](https://vercel.com/docs/functions/runtimes/node-js)

Validación: `node --experimental-strip-types --test tests/*.test.ts`, `npm run astro -- check` y `npm run build`. El desarrollo con `astro dev` sirve la interfaz estática; la función `/api/clima` corre en Vercel.
