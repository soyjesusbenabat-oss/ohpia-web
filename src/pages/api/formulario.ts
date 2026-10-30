import type { APIRoute } from 'astro';

// Este endpoint se ejecuta en el servidor (función de Vercel), no se genera como página estática.
export const prerender = false;

/*
 * Variables de entorno (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY  Clave de la API de Resend (obligatoria para enviar).
 *   CONTACT_TO      Buzón que recibe los formularios. Por defecto ohpia@ohpia.org.
 *   CONTACT_FROM    Remitente verificado en Resend, p. ej. "Web OHPIA <web@ohpia.org>".
 */
const env = (k: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env?.[k] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[k];

const TIPOS = {
  profesional: {
    asunto: 'Nuevo registro de profesional',
    campos: [
      ['nombre', 'Nombre'], ['email', 'Email'], ['perfil', 'Perfil'], ['sectores', 'Sectores'],
      ['provincia', 'Provincia o país'], ['linkedin', 'LinkedIn'],
      ['acreditacion', 'Le interesa la acreditación'], ['boletin', 'Quiere el boletín'],
    ],
    obligatorios: ['nombre', 'email', 'perfil', 'provincia'],
  },
  boletin: {
    asunto: 'Nueva suscripción al boletín',
    campos: [['email', 'Email']],
    obligatorios: ['email'],
  },
  contacto: {
    asunto: 'Nuevo mensaje de contacto',
    campos: [['nombre', 'Nombre'], ['email', 'Email'], ['organizacion', 'Organización'], ['motivo', 'Motivo'], ['mensaje', 'Mensaje']],
    obligatorios: ['nombre', 'email', 'motivo', 'mensaje'],
  },
} as const;
type Tipo = keyof typeof TIPOS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX = 5000;

// Límite sencillo por IP (por instancia): 5 envíos cada 10 minutos.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const wantsJson = (request.headers.get('content-type') ?? '').includes('application/json');
  const reply = (status: number, ok: boolean, error?: string) => {
    if (!wantsJson) return redirect(ok ? '/gracias' : `/gracias?error=1`, 303);
    return new Response(JSON.stringify(ok ? { ok } : { ok, error }), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  };

  // Solo desde nuestra propia web.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return reply(403, false, 'Origen no permitido.');
    } catch {
      return reply(403, false, 'Origen no permitido.');
    }
  }

  let data: Record<string, string> = {};
  try {
    if (wantsJson) {
      const raw = await request.json();
      for (const [k, v] of Object.entries(raw ?? {})) data[k] = String(v ?? '');
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => { data[k] = typeof v === 'string' ? v : ''; });
    }
  } catch {
    return reply(400, false, 'No hemos podido leer el formulario.');
  }

  for (const k of Object.keys(data)) data[k] = data[k].trim().slice(0, MAX);

  const tipo = data.tipo as Tipo;
  const conf = TIPOS[tipo];
  if (!conf) return reply(400, false, 'Formulario desconocido.');

  // Antispam: campo trampa relleno o envío demasiado rápido → respondemos ok y no enviamos.
  const t = Number(data.t);
  const tooFast = Number.isFinite(t) && t > 0 && Date.now() - t < 2500;
  if (data.web || tooFast) return reply(200, true);

  if (limited(clientAddress ?? 'x')) return reply(429, false, 'Demasiados envíos seguidos. Espera unos minutos.');

  for (const k of conf.obligatorios) if (!data[k]) return reply(400, false, 'Faltan campos obligatorios.');
  if (!EMAIL_RE.test(data.email)) return reply(400, false, 'El email no parece válido.');
  if (data.privacidad !== 'si') return reply(400, false, 'Para enviar, acepta la política de privacidad.');
  if (data.linkedin && !/^https?:\/\/\S+$/i.test(data.linkedin)) data.linkedin = '';

  const key = env('RESEND_API_KEY');
  const to = env('CONTACT_TO') || 'ohpia@ohpia.org';
  const from = env('CONTACT_FROM') || 'Web OHPIA <web@ohpia.org>';
  if (!key) {
    console.error('[formulario] Falta RESEND_API_KEY: el formulario no puede enviar correos.');
    return reply(503, false, 'El formulario aún no está activado.');
  }

  const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  const filas = conf.campos
    .filter(([k]) => data[k])
    .map(([k, label]) => [label, data[k] === 'si' ? 'Sí' : data[k]] as const);

  const asunto = `${conf.asunto}${data.nombre ? ` · ${data.nombre}` : ''}${data.motivo ? ` (${data.motivo})` : ''}`.slice(0, 180);
  const html = `<div style="font-family:Arial,sans-serif;color:#131F41;max-width:640px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#09697C">Web OHPIA · ${esc(conf.asunto)}</p>
  <table cellpadding="8" style="border-collapse:collapse;width:100%;font-size:15px;margin-top:12px">
  ${filas.map(([l, v]) => `<tr><td style="border-bottom:1px solid #E7E2D8;color:#5A6371;width:34%;vertical-align:top">${esc(l)}</td><td style="border-bottom:1px solid #E7E2D8;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}
  </table>
  <p style="font-size:12px;color:#5A6371;margin-top:16px">Recibido el ${esc(fecha)}. Consentimiento de privacidad: aceptado. Responde a este correo para contestar directamente.</p>
</div>`;
  const text = `${conf.asunto}\n\n${filas.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\nRecibido el ${fecha}. Consentimiento de privacidad: aceptado.`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: data.email,
        subject: asunto,
        html,
        text,
        tags: [{ name: 'formulario', value: tipo }],
      }),
    });
    if (!res.ok) {
      console.error('[formulario] Resend respondió', res.status, await res.text().catch(() => ''));
      return reply(502, false, 'No hemos podido enviarlo.');
    }
  } catch (e) {
    console.error('[formulario] Error de red con Resend', e);
    return reply(502, false, 'No hemos podido enviarlo.');
  }

  return reply(200, true);
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: 'Método no permitido.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
