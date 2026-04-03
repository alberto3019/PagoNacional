// Layout HTML compartido para emails transaccionales (logo centrado + contenido debajo).
import { emailBaseUrl } from './routes.js'

/** URL absoluta del logo para clientes de correo (requieren URL pública). */
export function absoluteLogoUrl() {
  const b = emailBaseUrl()
  if (b) return `${b}/logo-pago-nacional.png`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/logo-pago-nacional.png`
  }
  return '/logo-pago-nacional.png'
}

/**
 * Contenedor tipo “tarjeta”: fondo gris, bloque blanco, logo grande centrado y cuerpo debajo.
 * @param {string} innerContentHtml — HTML del mensaje (sin html/head/body envolvente).
 */
export function wrapEmailLayout(innerContentHtml) {
  const logo = absoluteLogoUrl()
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#ececf0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ececf0;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e2e8;box-shadow:0 4px 24px rgba(18,18,42,0.06);">
          <tr>
            <td style="padding:36px 28px 8px 28px;text-align:center;vertical-align:top;">
              <img src="${logo}" alt="Pago Nacional" width="280" style="display:block;max-width:85%;width:280px;height:auto;margin:0 auto;border:0;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 36px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:#1a1a2e;">
              ${innerContentHtml}
            </td>
          </tr>
        </table>
        <p style="font-family:system-ui,sans-serif;font-size:11px;color:#9ca3af;margin:16px 0 0 0;">Pago Nacional — Sistema de cambio de echeqs</p>
      </td>
    </tr>
  </table>
</body></html>`
}
