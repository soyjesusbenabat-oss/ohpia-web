# Web de OHPIA

Observatorio Hispano de Productividad con Inteligencia Artificial · https://www.ohpia.org

Web de una página hecha con [Astro](https://astro.build) y desplegada en Vercel. Los formularios se envían por correo con [Resend](https://resend.com).

## Dónde se cambia cada cosa

| Qué | Archivo |
| --- | --- |
| Textos de la portada y secciones | `src/pages/index.astro` |
| Tesis, principios, perfiles y motivos | `src/data/contenido.ts` |
| Nombre, email, dirección, NIF, n.º de registro, fecha de los textos legales, LinkedIn | `src/data/site.ts` |
| Colores, tipografías y estilos | `src/styles/global.css` |
| Páginas legales | `src/pages/aviso-legal.astro`, `privacidad.astro`, `cookies.astro` |
| Banner de cookies y Google Analytics | `src/components/CookieBanner.astro` |
| Envío de formularios | `src/pages/api/formulario.ts` |

## Formularios

Los tres formularios (registro de profesionales, boletín y contacto) llegan como correo a `CONTACT_TO`. El botón «Responder» contesta directamente a quien escribió.

Variables de entorno en Vercel (Project → Settings → Environment Variables):

- `RESEND_API_KEY`: clave de la API de Resend.
- `CONTACT_TO`: buzón que recibe los formularios (por defecto `ohpia@ohpia.org`; admite varios separados por comas).
- `CONTACT_FROM`: remitente con dominio verificado en Resend, p. ej. `Web OHPIA <web@ohpia.org>`.

Sin `RESEND_API_KEY` la web funciona, pero los formularios responden «El formulario aún no está activado» y ofrecen el email.

Antispam: campo trampa oculto, control de tiempo mínimo y límite de envíos por IP.

## Analítica y cookies

Google Analytics 4 solo se carga si la persona acepta las cookies analíticas en el banner. La elección se guarda 24 meses en el navegador (`ohpia-cookies`) y se puede cambiar desde «Configurar cookies» en el pie.

- El identificador está en `src/data/site.ts` (`analytics`): admite un contenedor de Tag Manager (`GTM-…`) o una propiedad de GA4 (`G-…`). Si se define la variable `PUBLIC_GA_ID` en Vercel, tiene prioridad. Sin identificador no aparece el banner.
- Tag Manager solo se carga tras el consentimiento, así que dentro del contenedor no hace falta configurar el modo de consentimiento: basta con la etiqueta de Google (GA4) disparada en todas las páginas.
- En GA4, poner la retención de datos en 14 meses (Administrar → Recopilación y modificación de datos → Retención de datos), que es lo que indica la política de privacidad.

## Trabajar en local

Requiere Node 24.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
```
