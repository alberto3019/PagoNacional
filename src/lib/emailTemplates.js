// Plantillas y armado del payload Resend (usa en /api/email en el servidor).
import { wrapEmailLayout } from './emailLayout.js'

/** Remitente Resend: variable RESEND_FROM_EMAIL (servidor) o dominio verificado en resend.com/domains */
function getFromEmail() {
  const raw =
    typeof process !== 'undefined' && process.env?.RESEND_FROM_EMAIL
      ? String(process.env.RESEND_FROM_EMAIL).trim()
      : ''
  if (raw) {
    if (raw.includes('<')) return raw
    return `Pago Nacional <${raw}>`
  }
  return 'Pago Nacional <administracion@pagonacional.com>'
}

const FROM_EMAIL = getFromEmail()

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;')
}

function adminPanelUrl(baseUrl) {
  const b = String(baseUrl || '').replace(/\/$/, '')
  return b ? `${b}/admin` : '/admin'
}

/**
 * @param {string} kind
 * @param {string} baseUrl - URL pública del sitio (logo y enlaces)
 * @param {object} payload
 * @returns {{ from: string, to: string, subject: string, html: string, attachments?: Array<{filename: string, content: string}> }}
 */
export function buildResendPayload(kind, baseUrl, payload) {
  switch (kind) {
    case 'verificacion':
      return buildVerificacion(baseUrl, payload)
    case 'reset':
      return buildReset(baseUrl, payload)
    case 'confirmacion':
      return buildConfirmacion(baseUrl, payload)
    case 'admin':
      return buildAdmin(baseUrl, payload)
    case 'aprobacion':
      return buildAprobacion(baseUrl, payload)
    default:
      throw new Error(`Tipo de email desconocido: ${kind}`)
  }
}

function buildVerificacion(baseUrl, { email, nombre, linkVerificacion }) {
  const innerHtml = `
    <h2 style="font-size:22px;font-weight:600;margin:0 0 12px 0;">Hola, ${escapeHtml(nombre)}</h2>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 24px 0;">
      Para activar tu cuenta y comenzar a operar, verificá tu dirección de email tocando el botón.
    </p>
    <p style="text-align:center;margin:0 0 20px 0;">
      <a href="${escapeAttr(linkVerificacion)}"
         style="display:inline-block;background:#12122a;color:#fff;padding:14px 28px;text-decoration:none;font-size:14px;font-weight:500;border-radius:8px;">
        Verificar mi cuenta
      </a>
    </p>
    <p style="font-size:12px;color:#9ca3af;margin:0;">Si no creaste una cuenta en Pago Nacional, podés ignorar este email.</p>
  `
  return {
    from: FROM_EMAIL,
    to: email,
    subject: 'Verificá tu cuenta — Pago Nacional',
    html: wrapEmailLayout(innerHtml, baseUrl),
  }
}

function buildReset(baseUrl, { email, nombre, linkReset }) {
  const innerHtml = `
    <h2 style="font-size:22px;font-weight:600;margin:0 0 12px 0;">Hola, ${escapeHtml(nombre || 'usuario')}</h2>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 24px 0;">
      Recibimos un pedido para restablecer la contraseña de tu cuenta. Si fuiste vos, tocá el botón y elegí una clave nueva. El enlace vence en una hora.
    </p>
    <p style="text-align:center;margin:0 0 20px 0;">
      <a href="${escapeAttr(linkReset)}"
         style="display:inline-block;background:#12122a;color:#fff;padding:14px 28px;text-decoration:none;font-size:14px;font-weight:500;border-radius:8px;">
        Restablecer contraseña
      </a>
    </p>
    <p style="font-size:13px;color:#6b7280;margin:0 0 8px 0;line-height:1.6;">
      Si el botón no funciona, copiá y pegá este enlace en el navegador:<br/>
      <span style="word-break:break-all;font-size:12px;color:#4b5563;">${escapeHtml(linkReset)}</span>
    </p>
    <p style="font-size:12px;color:#9ca3af;margin:20px 0 0 0;">Si no pediste restablecer la contraseña, ignorá este mensaje.</p>
  `
  return {
    from: FROM_EMAIL,
    to: email,
    subject: 'Restablecer contraseña — Pago Nacional',
    html: wrapEmailLayout(innerHtml, baseUrl),
  }
}

function buildConfirmacion(baseUrl, { email, nombre, solicitud }) {
  const innerHtml = `
    <h2 style="font-size:22px;font-weight:600;margin:0 0 12px 0;">Solicitud recibida</h2>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 20px 0;">
      Hola ${escapeHtml(nombre)}, tu solicitud fue recibida correctamente y está siendo procesada.
    </p>
    <div style="background:#f7f7f5;border-radius:10px;padding:18px 20px;margin:0 0 20px 0;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:6px 0;">N° solicitud</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.numero)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">N° echeq</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.numero_echeq)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Monto</td><td style="text-align:right;font-weight:600;">$${Number(solicitud.monto).toLocaleString('es-AR')}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Banco emisor</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.banco_emisor)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Vencimiento</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.fecha_vencimiento)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">CBU/CVU</td><td style="text-align:right;font-weight:600;font-size:12px;">${escapeHtml(solicitud.cbu_cvu)}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">Este email es constancia de tu solicitud. Te notificaremos cuando sea aprobada o rechazada.</p>
  `
  return {
    from: FROM_EMAIL,
    to: email,
    subject: `Solicitud recibida ${solicitud.numero} — Pago Nacional`,
    html: wrapEmailLayout(innerHtml, baseUrl),
  }
}

function buildAdmin(baseUrl, { adminEmail, solicitud, camionero, attachments }) {
  const nombreCompleto = `${camionero.nombre || ''} ${camionero.apellido || ''}`.trim() || 'camionero'
  let pdfFooter = ''
  if (attachments?.length) {
    pdfFooter = `
    <p style="font-size:13px;color:#6b7280;margin:20px 0 0 0;line-height:1.5;">
      Adjunto: Términos y Condiciones aceptados digitalmente por el camionero (PDF).
    </p>`
  } else if (solicitud.terminos_html) {
    pdfFooter = `
    <p style="font-size:13px;color:#b45309;margin:20px 0 0 0;line-height:1.5;">
      No se pudo adjuntar el PDF automáticamente. Revisá los T&amp;C guardados en la solicitud en el panel admin.
    </p>`
  }
  const innerHtml = `
    <p style="margin:0 0 8px 0;">
      <span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;padding:4px 10px;border-radius:999px;font-family:system-ui,sans-serif;">Nueva solicitud</span>
    </p>
    <h2 style="font-size:20px;font-weight:600;margin:0 0 16px 0;line-height:1.3;">
      ${escapeHtml(nombreCompleto)} envió una solicitud
    </h2>
    <div style="background:#f7f7f5;border-radius:10px;padding:18px 20px;margin:0 0 20px 0;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:6px 0;">N° solicitud</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.numero)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">N° echeq</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.numero_echeq)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Monto</td><td style="text-align:right;font-weight:600;">$${Number(solicitud.monto).toLocaleString('es-AR')}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Banco emisor</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.banco_emisor)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Vencimiento</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.fecha_vencimiento)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">DNI</td><td style="text-align:right;font-weight:600;">${escapeHtml(camionero.dni)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">CUIT</td><td style="text-align:right;font-weight:600;">${escapeHtml(camionero.cuit)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Email</td><td style="text-align:right;font-weight:600;">${escapeHtml(camionero.email)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Celular</td><td style="text-align:right;font-weight:600;">${escapeHtml(camionero.celular)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">CBU/CVU</td><td style="text-align:right;font-weight:600;font-size:12px;">${escapeHtml(solicitud.cbu_cvu)}</td></tr>
      </table>
    </div>
    <p style="text-align:center;margin:0;">
      <a href="${escapeAttr(adminPanelUrl(baseUrl))}"
         style="display:inline-block;background:#12122a;color:#fff;padding:13px 26px;text-decoration:none;font-size:14px;font-weight:500;border-radius:8px;">
        Ver en el panel admin
      </a>
    </p>
    ${pdfFooter}
  `
  return {
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `Nueva solicitud ${solicitud.numero} — ${nombreCompleto}`,
    html: wrapEmailLayout(innerHtml, baseUrl),
    ...(attachments?.length ? { attachments } : {}),
  }
}

function buildAprobacion(baseUrl, { email, nombre, solicitud, cuenta, attachments }) {
  let pdfFooter = ''
  if (attachments?.length) {
    pdfFooter = `
    <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
      Adjunto: copia de los Términos y Condiciones firmados digitalmente al momento de tu solicitud. Conservala como respaldo.
    </p>`
  } else if (solicitud.terminos_html) {
    pdfFooter = `
    <p style="font-size:13px;color:#b45309;margin:0;line-height:1.5;">
      No se pudo adjuntar el PDF automáticamente. Los T&amp;C quedan guardados en tu solicitud en el sistema.
    </p>`
  }
  const innerHtml = `
    <h2 style="font-size:22px;font-weight:600;margin:0 0 12px 0;">Tu solicitud fue aprobada</h2>
    <p style="font-size:15px;line-height:1.7;color:#4b5563;margin:0 0 20px 0;">
      Hola ${escapeHtml(nombre || '')}, enviá el echeq a la cuenta asignada para continuar con la operación.
    </p>
    <div style="background:#f7f7f5;border-radius:10px;padding:18px 20px;margin:0 0 16px 0;">
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="color:#6b7280;padding:6px 0;">N° solicitud</td><td style="text-align:right;font-weight:600;">${escapeHtml(solicitud.numero)}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Titular</td><td style="text-align:right;font-weight:600;">${escapeHtml(cuenta?.titular || '-')}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Alias</td><td style="text-align:right;font-weight:600;">${escapeHtml(cuenta?.alias || '-')}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">CBU/CVU</td><td style="text-align:right;font-weight:600;font-size:12px;">${escapeHtml(cuenta?.cvu || cuenta?.cbu || '-')}</td></tr>
        <tr><td style="color:#6b7280;padding:6px 0;">Banco</td><td style="text-align:right;font-weight:600;">${escapeHtml(cuenta?.banco || '-')}</td></tr>
      </table>
    </div>
    ${pdfFooter}
  `
  return {
    from: FROM_EMAIL,
    to: email,
    subject: `Solicitud aprobada ${solicitud.numero} — Pago Nacional`,
    html: wrapEmailLayout(innerHtml, baseUrl),
    ...(attachments?.length ? { attachments } : {}),
  }
}
