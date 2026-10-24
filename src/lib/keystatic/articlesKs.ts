import { collection, fields } from "@keystatic/core";
import { MUNICIPALITIES } from "../config/municipal";

export const articlesKs = collection({
  label: "Noticias",
  slugField: "title",
  path: "src/content/articles/*/",
  format: { contentField: "content" },
  entryLayout: "form",
  schema: {
    reviewed: fields.checkbox({ label: "Revisión editorial completada", defaultValue: false }),
    municipality: fields.select({ label: "Municipio", options: MUNICIPALITIES.map(({ slug, name }) => ({ label: name, value: slug })), defaultValue: "garcia" }),
    sourceName: fields.text({ label: "Nombre de la fuente oficial" }),
    sourceUrl: fields.url({ label: "Enlace de la publicación original" }),
    photoCredit: fields.text({ label: "Crédito de la fotografía" }),
    covert_alt: fields.text({ label: "Descripción de la fotografía" }),
    eventDate: fields.datetime({ label: "Fecha del evento (opcional)" }),
    eventLocation: fields.text({ label: "Lugar del evento" }),
    eventAdmission: fields.text({ label: "Acceso o costo confirmado" }),
    eventStatus: fields.select({ label: "Estado del evento", options: [{ label: "Programado", value: "programado" }, { label: "Cancelado", value: "cancelado" }], defaultValue: "programado" }),
    isDraft: fields.checkbox({
      label: "Guardar como borrador",
      defaultValue: false,
    }),
    isMainHeadline: fields.checkbox({
      label: "Destacar en portada",
      defaultValue: false,
    }),
    isSubHeadline: fields.checkbox({
      label: "Destacar como nota secundaria",
      defaultValue: false,
    }),
    description: fields.text({
      label: "Resumen",
      validation: { isRequired: true, length: { max: 160 } },
    }),
    title: fields.slug({
      name: { label: "Título", validation: { length: { max: 120 } } },
    }),
    cover: fields.image({
      label: "Fotografía (opcional)",
      directory: "src/assets/images/articles",
      publicPath: "@assets/images/articles/",
    }),
    category: fields.relationship({
      label: "Categoría",
      collection: "categories",
    }),
    publishedTime: fields.datetime({
      label: "Fecha de publicación de la nota",
      validation: { isRequired: true },
    }),
    authors: fields.array(
      fields.relationship({
        label: "Autores",
        collection: "authors",
      }),
      {
        label: "Autores",
        itemLabel: (props) => props.value ?? "",
        validation: {
          length: {
            min: 1,
          },
        },
      }
    ),
    content: fields.mdx({
      label: "Texto de la noticia",
      options: {
        image: {
          directory: "src/assets/images/articles",
          publicPath: "@assets/images/articles",
        },
      },
    }),
  },
});
