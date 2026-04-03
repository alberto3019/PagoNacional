// POST /api/email — envía correos vía Resend (clave solo en servidor; evita CORS del navegador).
import { buildResendPayload } from '../src/lib/emailTemplates.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (req.method !== 'POST') {
    res.statusCode = 405
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    res.statusCode = 500
    return res.end(JSON.stringify({ error: 'RESEND_API_KEY no configurada en el servidor' }))
  }

  let body = req.body
  if (body == null || typeof body === 'string') {
    try {
      const raw = typeof body === 'string' ? body : ''
      body = raw ? JSON.parse(raw) : {}
    } catch {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'JSON inválido' }))
    }
  }

  const { kind, baseUrl: baseUrlRaw, payload } = body || {}
  let baseUrl = String(baseUrlRaw || '').replace(/\/$/, '')
  if (!baseUrl) {
    baseUrl = String(process.env.VITE_APP_URL || '').replace(/\/$/, '')
  }
  if (!baseUrl && process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')
  }

  try {
    const resendBody = buildResendPayload(kind, baseUrl, payload || {})
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      res.statusCode = 502
      return res.end(
        JSON.stringify({
          error: data?.message || data?.error || 'Error de Resend al enviar el email',
        })
      )
    }
    res.statusCode = 200
    return res.end(JSON.stringify({ ok: true, data }))
  } catch (e) {
    res.statusCode = 500
    return res.end(JSON.stringify({ error: e?.message || 'Error interno' }))
  }
}
