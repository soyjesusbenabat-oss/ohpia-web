// Envío de los tres formularios (profesional, boletín, contacto) a /api/formulario.
// Sin JavaScript, los formularios también funcionan: el endpoint redirige a /gracias.

const EMAIL = 'ohpia@ohpia.org';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setMsg(form: HTMLFormElement, html: string) {
  const el = form.querySelector<HTMLElement>('.form-msg');
  if (!el) return;
  el.innerHTML = html;
  el.classList.toggle('err', !!html);
}

function validate(form: HTMLFormElement): string | null {
  let first: HTMLElement | null = null;
  let reason = '';
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach((el) => {
    if (el.type === 'hidden' || el.closest('.hp')) return;
    let bad = false;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      bad = el.required && !el.checked;
      if (bad && !reason) reason = 'Para enviar, acepta la política de privacidad.';
    } else {
      const v = el.value.trim();
      if (el.required && !v) { bad = true; if (!reason) reason = 'Rellena los campos obligatorios.'; }
      else if (el.type === 'email' && v && !EMAIL_RE.test(v)) { bad = true; if (!reason) reason = 'Revisa el email: parece incompleto.'; }
      else if (el.type === 'url' && v && !/^https?:\/\/\S+\.\S+/.test(v)) { bad = true; if (!reason) reason = 'El enlace de LinkedIn debe empezar por https://'; }
      el.setAttribute('aria-invalid', String(bad));
    }
    if (bad && !first) first = el;
  });
  if (first) { (first as HTMLElement).focus(); return reason; }
  return null;
}

export function initForms() {
  const started = Date.now();

  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    const t = form.querySelector<HTMLInputElement>('input[name="t"]');
    if (t) t.value = String(started);

    form.addEventListener('input', (e) => {
      const el = e.target as HTMLElement;
      if (el.getAttribute('aria-invalid') === 'true') el.setAttribute('aria-invalid', 'false');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMsg(form, '');
      const problem = validate(form);
      if (problem) { setMsg(form, problem); return; }

      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const label = btn?.textContent ?? '';
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Enviando…'; }

      const data: Record<string, string> = {};
      new FormData(form).forEach((v, k) => { data[k] = String(v); });

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) throw new Error(out.error || 'error');
        const done = form.nextElementSibling as HTMLElement | null;
        form.hidden = true;
        if (done) { done.hidden = false; done.focus(); }
      } catch (err) {
        const msg = err instanceof Error && err.message && err.message !== 'error' && err.message !== 'Failed to fetch'
          ? err.message
          : 'No hemos podido enviarlo.';
        setMsg(form, `${msg} Inténtalo de nuevo o escríbenos a <a href="mailto:${EMAIL}">${EMAIL}</a>.`);
      } finally {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = label; }
      }
    });
  });

  // Botones que llevan al formulario de contacto con un motivo ya elegido.
  const motivo = document.querySelector<HTMLSelectElement>('#contacto-form select[name="motivo"]');
  document.querySelectorAll<HTMLAnchorElement>('a[data-motivo]').forEach((a) => {
    a.addEventListener('click', () => {
      if (!motivo) return;
      motivo.value = a.dataset.motivo || '';
      motivo.setAttribute('aria-invalid', 'false');
      setTimeout(() => document.querySelector<HTMLInputElement>('#contacto-form input[name="nombre"]')?.focus({ preventScroll: true }), 500);
    });
  });
}
