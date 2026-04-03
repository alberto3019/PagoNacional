// src/lib/emails.js
// Servicio de emails usando Resend API
// En produccion esto deberia correr desde un edge function de Supabase
// para no exponer la API key en el frontend.

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const FROM_EMAIL = 'Pago Nacional <notificaciones@pagonacional.com.ar>'

async function enviarEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  })
  if (!res.ok) {
    const err = await res.json()
    console.error('Error enviando email:', err)
  }
}

export async function enviarResetPasswordEmail(email, nombre, linkReset) {
  if (!RESEND_API_KEY) {
    throw new Error('El envío de emails no está configurado (VITE_RESEND_API_KEY).')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: 'Restablecer contraseña — Pago Nacional',
      html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 0; color: #1a1a2e;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Pago Nacional</span>
        </div>
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 12px;">Hola, ${nombre || 'usuario'}</h2>
        <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 28px;">
          Recibimos un pedido para restablecer la contraseña de tu cuenta. Si fuiste vos, tocá el botón y elegí una clave nueva. El enlace vence en una hora.
        </p>
        <a href="${linkReset}"
           style="display: inline-block; background: #1a1a2e; color: #fff; padding: 14px 28px;
                  text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 6px;">
          Restablecer contraseña
        </a>
        <p style="font-size: 13px; color: #888; margin-top: 24px; line-height: 1.6;">
          Si el botón no funciona, copiá y pegá este enlace en el navegador:<br/>
          <span style="word-break: break-all; font-size: 12px;">${linkReset}</span>
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 28px;">
          Si no pediste restablecer la contraseña, ignorá este mensaje.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #bbb;">Pago Nacional &mdash; Sistema de cambio de echeqs</p>
      </div>
    `,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Error enviando email de reset:', err)
    throw new Error(err?.message || 'No se pudo enviar el email. Revisá la configuración de Resend.')
  }
}

export async function enviarVerificacionEmail(email, nombre, linkVerificacion) {
  await enviarEmail({
    to: email,
    subject: 'Verificá tu cuenta — Pago Nacional',
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 0; color: #1a1a2e;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Pago Nacional</span>
        </div>
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 12px;">Hola, ${nombre}</h2>
        <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 28px;">
          Para activar tu cuenta y comenzar a operar, verificá tu direccion de email haciendo click en el boton a continuacion.
        </p>
        <a href="${linkVerificacion}"
           style="display: inline-block; background: #1a1a2e; color: #fff; padding: 14px 28px;
                  text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 6px;">
          Verificar mi cuenta
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 32px;">
          Este link tiene validez por 24 horas. Si no creaste una cuenta en Pago Nacional, podés ignorar este email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #bbb;">Pago Nacional &mdash; Sistema de cambio de echeqs</p>
      </div>
    `
  })
}

export async function enviarConfirmacionSolicitud(email, nombre, solicitud) {
  await enviarEmail({
    to: email,
    subject: `Solicitud recibida ${solicitud.numero} — Pago Nacional`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 0; color: #1a1a2e;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Pago Nacional</span>
        </div>
        <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 12px;">Solicitud recibida</h2>
        <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 24px;">
          Hola ${nombre}, tu solicitud fue recibida correctamente y esta siendo procesada.
        </p>
        <div style="background: #f7f7f5; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="color: #888; padding: 6px 0;">N° solicitud</td><td style="text-align:right; font-weight: 600;">${solicitud.numero}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">N° echeq</td><td style="text-align:right; font-weight: 600;">${solicitud.numero_echeq}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Monto</td><td style="text-align:right; font-weight: 600;">$${Number(solicitud.monto).toLocaleString('es-AR')}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Banco emisor</td><td style="text-align:right; font-weight: 600;">${solicitud.banco_emisor}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Vencimiento</td><td style="text-align:right; font-weight: 600;">${solicitud.fecha_vencimiento}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">CBU/CVU</td><td style="text-align:right; font-weight: 600; font-size:12px;">${solicitud.cbu_cvu}</td></tr>
          </table>
        </div>
        <p style="font-size: 13px; color: #888; line-height: 1.6;">
          Este email es constancia de tu solicitud. Te notificaremos cuando sea aprobada o rechazada.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #bbb;">Pago Nacional &mdash; Sistema de cambio de echeqs</p>
      </div>
    `
  })
}

export async function enviarNotificacionAdmin(adminEmail, solicitud, camionero) {
  await enviarEmail({
    to: adminEmail,
    subject: `Nueva solicitud ${solicitud.numero} — ${camionero.nombre} ${camionero.apellido}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 0; color: #1a1a2e;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">Pago Nacional</span>
          <span style="margin-left: 10px; background: #fff3cd; color: #856404; font-size: 11px; padding: 3px 8px; border-radius: 20px; font-family: sans-serif;">Nueva solicitud</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
          ${camionero.nombre} ${camionero.apellido} envio una solicitud
        </h2>
        <div style="background: #f7f7f5; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="color: #888; padding: 6px 0;">N° solicitud</td><td style="text-align:right; font-weight:600;">${solicitud.numero}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">N° echeq</td><td style="text-align:right; font-weight:600;">${solicitud.numero_echeq}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Monto</td><td style="text-align:right; font-weight:600;">$${Number(solicitud.monto).toLocaleString('es-AR')}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Banco emisor</td><td style="text-align:right; font-weight:600;">${solicitud.banco_emisor}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Vencimiento</td><td style="text-align:right; font-weight:600;">${solicitud.fecha_vencimiento}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">DNI camionero</td><td style="text-align:right; font-weight:600;">${camionero.dni}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">CUIT</td><td style="text-align:right; font-weight:600;">${camionero.cuit}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Email</td><td style="text-align:right; font-weight:600;">${camionero.email}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">Celular</td><td style="text-align:right; font-weight:600;">${camionero.celular}</td></tr>
            <tr><td style="color: #888; padding: 6px 0;">CBU/CVU</td><td style="text-align:right; font-weight:600; font-size:12px;">${solicitud.cbu_cvu}</td></tr>
          </table>
        </div>
        <a href="${import.meta.env.VITE_APP_URL}/src/pages/admin.html"
           style="display: inline-block; background: #1a1a2e; color: #fff; padding: 13px 26px;
                  text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 6px;">
          Ver en el panel admin
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #bbb;">Pago Nacional &mdash; Sistema de cambio de echeqs</p>
      </div>
    `
  })
}

export async function enviarAprobacionConCuenta(email, nombre, solicitud, cuenta) {
  if (!email) return
  await enviarEmail({
    to: email,
    subject: `Solicitud aprobada ${solicitud.numero} — Pago Nacional`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 0; color: #1a1a2e;">
        <div style="margin-bottom: 28px;">
          <span style="font-size: 20px; font-weight: 600;">Pago Nacional</span>
        </div>
        <h2 style="font-size: 22px; margin-bottom: 10px;">Tu solicitud fue aprobada</h2>
        <p style="font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 20px;">
          Hola ${nombre || ''}, enviá el echeq a la cuenta asignada para continuar con la operación.
        </p>
        <div style="background: #f7f7f5; border-radius: 8px; padding: 20px 24px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="color:#888; padding:6px 0;">N° solicitud</td><td style="text-align:right; font-weight:600;">${solicitud.numero}</td></tr>
            <tr><td style="color:#888; padding:6px 0;">Titular</td><td style="text-align:right; font-weight:600;">${cuenta?.titular || '-'}</td></tr>
            <tr><td style="color:#888; padding:6px 0;">Alias</td><td style="text-align:right; font-weight:600;">${cuenta?.alias || '-'}</td></tr>
            <tr><td style="color:#888; padding:6px 0;">CBU/CVU</td><td style="text-align:right; font-weight:600; font-size:12px;">${cuenta?.cvu || cuenta?.cbu || '-'}</td></tr>
            <tr><td style="color:#888; padding:6px 0;">Banco</td><td style="text-align:right; font-weight:600;">${cuenta?.banco || '-'}</td></tr>
          </table>
        </div>
      </div>
    `
  })
}
