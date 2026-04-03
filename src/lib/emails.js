// src/lib/emails.js
// Emails vía Resend (desde el navegador). Layout unificado en emailLayout.js.
import { adminPanelAbsoluteUrl } from './routes.js'
import { wrapEmailLayout } from './emailLayout.js'
import { terminosHtmlToPdfBase64 } from './terminosPdf.js'

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const FROM_EMAIL = 'Pago Nacional <notificaciones@pagonacional.com.ar>'

async function enviarResend({ to, subject, innerHtml, attachments }) {
  if (!RESEND_API_KEY) {
    console.warn('Resend: VITE_RESEND_API_KEY no configurada; email no enviado.')
    return
  }
  const html = wrapEmailLayout(innerHtml)
  const payload = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  }
  if (attachments?.length) {
    payload.attachments = attachments
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Error enviando email:', err)
  }
}

export async function enviarResetPasswordEmail(email, nombre, linkReset) {
  if (!RESEND_API_KEY) {
    throw new Error('El envío de emails no está configurado (VITE_RESEND_API_KEY).')
  }
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
  const html = wrapEmailLayout(innerHtml)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: 'Restablecer contraseña — Pago Nacional', html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Error enviando email de reset:', err)
    throw new Error(err?.message || 'No se pudo enviar el email. Revisá la configuración de Resend.')
  }
}

export async function enviarVerificacionEmail(email, nombre, linkVerificacion) {
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
  await enviarResend({
    to: email,
    subject: 'Verificá tu cuenta — Pago Nacional',
    innerHtml,
  })
}

export async function enviarConfirmacionSolicitud(email, nombre, solicitud) {
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
  await enviarResend({
    to: email,
    subject: `Solicitud recibida ${solicitud.numero} — Pago Nacional`,
    innerHtml,
  })
}

export async function enviarNotificacionAdmin(adminEmail, solicitud, camionero) {
  const nombreCompleto = `${camionero.nombre || ''} ${camionero.apellido || ''}`.trim() || 'camionero'
  const attachments = []
  const b64 = await terminosHtmlToPdfBase64(solicitud.terminos_html)
  let pdfFooter = ''
  if (b64) {
    attachments.push({
      filename: `Terminos-y-condiciones-${String(solicitud.numero || 'solicitud').replace(/[^\w.-]+/g, '_')}.pdf`,
      content: b64,
    })
    pdfFooter = `
    <p style="font-size:13px;color:#6b7280;margin:20px 0 0 0;line-height:1.5;">
      Adjunto: Términos y Condiciones aceptados digitalmente por el camionero (PDF).
    </p>`
  } else if (solicitud.terminos_html) {
    console.warn('No se pudo generar el PDF de T&C para el email al admin.')
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
      <a href="${escapeAttr(adminPanelAbsoluteUrl())}"
         style="display:inline-block;background:#12122a;color:#fff;padding:13px 26px;text-decoration:none;font-size:14px;font-weight:500;border-radius:8px;">
        Ver en el panel admin
      </a>
    </p>
    ${pdfFooter}
  `
  await enviarResend({
    to: adminEmail,
    subject: `Nueva solicitud ${solicitud.numero} — ${nombreCompleto}`,
    innerHtml,
    attachments: attachments.length ? attachments : undefined,
  })
}

export async function enviarAprobacionConCuenta(email, nombre, solicitud, cuenta) {
  if (!email) return
  const attachments = []
  const b64 = await terminosHtmlToPdfBase64(solicitud.terminos_html)
  let pdfFooter = ''
  if (b64) {
    attachments.push({
      filename: `Terminos-y-condiciones-${String(solicitud.numero || 'solicitud').replace(/[^\w.-]+/g, '_')}.pdf`,
      content: b64,
    })
    pdfFooter = `
    <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
      Adjunto: copia de los Términos y Condiciones firmados digitalmente al momento de tu solicitud. Conservala como respaldo.
    </p>`
  } else if (solicitud.terminos_html) {
    console.warn('No se pudo generar el PDF de T&C para el email de aprobación.')
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
  await enviarResend({
    to: email,
    subject: `Solicitud aprobada ${solicitud.numero} — Pago Nacional`,
    innerHtml,
    attachments: attachments.length ? attachments : undefined,
  })
}

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
