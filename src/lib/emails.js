// src/lib/emails.js
// El envío real va a POST /api/email (Resend con RESEND_API_KEY en el servidor).
import { emailBaseUrl } from './routes.js'
import { terminosHtmlToPdfBase64 } from './terminosPdf.js'

async function postEmail(kind, payload) {
  const baseUrl = emailBaseUrl()
  const res = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, baseUrl, payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `No se pudo enviar el email (${res.status})`)
  }
  return data
}

export async function enviarResetPasswordEmail(email, nombre, linkReset) {
  await postEmail('reset', { email, nombre, linkReset })
}

export async function enviarVerificacionEmail(email, nombre, linkVerificacion) {
  await postEmail('verificacion', { email, nombre, linkVerificacion })
}

export async function enviarConfirmacionSolicitud(email, nombre, solicitud, liquidacion) {
  await postEmail('confirmacion', { email, nombre, solicitud, liquidacion: liquidacion || null })
}

export async function enviarNotificacionAdmin(adminEmail, solicitud, camionero) {
  const attachments = []
  const b64 = await terminosHtmlToPdfBase64(solicitud.terminos_html)
  if (b64) {
    attachments.push({
      filename: `Terminos-y-condiciones-${String(solicitud.numero || 'solicitud').replace(/[^\w.-]+/g, '_')}.pdf`,
      content: b64,
    })
  } else if (solicitud.terminos_html) {
    console.warn('No se pudo generar el PDF de T&C para el email al admin.')
  }
  await postEmail('admin', {
    adminEmail,
    solicitud,
    camionero,
    ...(attachments.length ? { attachments } : {}),
  })
}

export async function enviarAprobacionConCuenta(email, nombre, solicitud, cuenta, liquidacion) {
  if (!email) return
  const attachments = []
  const b64 = await terminosHtmlToPdfBase64(solicitud.terminos_html)
  if (b64) {
    attachments.push({
      filename: `Terminos-y-condiciones-${String(solicitud.numero || 'solicitud').replace(/[^\w.-]+/g, '_')}.pdf`,
      content: b64,
    })
  } else if (solicitud.terminos_html) {
    console.warn('No se pudo generar el PDF de T&C para el email de aprobación.')
  }
  await postEmail('aprobacion', {
    email,
    nombre,
    solicitud,
    cuenta,
    liquidacion: liquidacion || null,
    ...(attachments.length ? { attachments } : {}),
  })
}
