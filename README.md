# Web de OHPIA

Observatorio Hispano de Productividad con Inteligencia Artificial · https://ohpia.com

Web de una página hecha con [Astro](https://astro.build) y desplegada en Vercel. Los formularios se envían por correo con [Resend](https://resend.com).

## Dónde se cambia cada cosa

| Qué | Archivo |
| --- | --- |
| Textos de la portada y secciones | `src/pages/index.astro` |
| Tesis, principios, perfiles y motivos | `src/data/contenido.ts` |
| Nombre, email, dirección, NIF, LinkedIn | `src/data/site.ts` |
| Colores, tipografías y estilos | `src/styles/global.css` |
| Páginas legales (provisionales) | `src/pages/aviso-legal.astro`, `privacidad.astro`, `cookies.astro` |
| Envío de formularios | `src/pages/api/formulario.ts` |

## Formularios

Los tres formularios (registro de profesionales, boletín y contacto) llegan como correo a `CONTACT_TO`. El botón «Responder» contesta directamente a quien escribió.

Variables de entorno en Vercel (Project → Settings → Environment Variables):

- `RESEND_API_KEY`: clave de la API de Resend.
- `CONTACT_TO`: buzón que recibe los formularios (por defecto `ohpia@ohpia.org`; admite varios separados por comas).
- `CONTACT_FROM`: remitente con dominio verificado en Resend, p. ej. `Web OHPIA <web@ohpia.org>`.

Sin `RESEND_API_KEY` la web funciona, pero los formularios responden «El formulario aún no está activado» y ofrecen el email.

Antispam: campo trampa oculto, control de tiempo mínimo y límite de envíos por IP. Sin cookies ni seguimiento.

## Trabajar en local

Requiere Node 24.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
```
