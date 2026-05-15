// src/lib/supabase.js
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function isSupabaseConfigured() {
  return !!(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('xxxxxxxx') &&
    !SUPABASE_ANON_KEY.includes('...')
  )
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase no está configurado. Definí VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, reconstruí la app y verificá el SQL en el proyecto.'
    )
  }
}

// ─── PRESTAMISTA (config global, una fila id = 1) ───────────────

export async function obtenerPrestamistaConfig() {
  requireSupabase()
  const { data, error } = await supabase.from('prestamista_config').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  if (!data) {
    return {
      razon_social: '',
      cuit: '',
      domicilio: '',
      email_legal: '',
      telefono: '',
    }
  }
  return {
    razon_social: data.razon_social || '',
    cuit: data.cuit || '',
    domicilio: data.domicilio || '',
    email_legal: data.email_legal || '',
    telefono: data.telefono || '',
  }
}

// ─── FINANZAS (comisión Pago Nacional + gasto admin por gestión) ─

export async function obtenerFinanzasConfig() {
  requireSupabase()
  const { data, error } = await supabase.from('finanzas_config').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  if (!data) {
    return { comision_pagonacional_pct: 10, gasto_administrativo: 0 }
  }
  return {
    comision_pagonacional_pct: Number(data.comision_pagonacional_pct) ?? 10,
    gasto_administrativo: Number(data.gasto_administrativo) ?? 0,
  }
}

export async function guardarFinanzasConfig(datos) {
  requireSupabase()
  const pct = Number(datos?.comision_pagonacional_pct)
  const gasto = Number(datos?.gasto_administrativo)
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw new Error('La comisión Pago Nacional debe ser un porcentaje entre 0 y 100.')
  }
  if (!Number.isFinite(gasto) || gasto < 0) {
    throw new Error('El gasto administrativo debe ser un monto mayor o igual a 0.')
  }
  const row = {
    id: 1,
    comision_pagonacional_pct: pct,
    gasto_administrativo: gasto,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('finanzas_config').upsert(row, { onConflict: 'id' }).select().single()
  if (error) throw error
  return {
    comision_pagonacional_pct: Number(data.comision_pagonacional_pct) ?? 10,
    gasto_administrativo: Number(data.gasto_administrativo) ?? 0,
  }
}

// ─── COMERCIALES ───────────────────────────────────────────────

export async function listarComerciales() {
  requireSupabase()
  const { data, error } = await supabase.from('comerciales').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function crearComercial(datos) {
  requireSupabase()
  const nombre = String(datos?.nombre ?? '').trim()
  const apellido = String(datos?.apellido ?? '').trim()
  const porcentaje_comision = Number(datos?.porcentaje_comision)
  if (!nombre || !apellido) throw new Error('Nombre y apellido del comercial son obligatorios.')
  if (!Number.isFinite(porcentaje_comision) || porcentaje_comision < 0 || porcentaje_comision > 100) {
    throw new Error('El porcentaje de comisión debe estar entre 0 y 100.')
  }
  const { data, error } = await supabase
    .from('comerciales')
    .insert([{ nombre, apellido, porcentaje_comision }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarComercial(comercialId, datos) {
  requireSupabase()
  const nombre = String(datos?.nombre ?? '').trim()
  const apellido = String(datos?.apellido ?? '').trim()
  const porcentaje_comision = Number(datos?.porcentaje_comision)
  if (!nombre || !apellido) throw new Error('Nombre y apellido del comercial son obligatorios.')
  if (!Number.isFinite(porcentaje_comision) || porcentaje_comision < 0 || porcentaje_comision > 100) {
    throw new Error('El porcentaje de comisión debe estar entre 0 y 100.')
  }
  const { data, error } = await supabase
    .from('comerciales')
    .update({ nombre, apellido, porcentaje_comision })
    .eq('id', comercialId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarComercial(comercialId) {
  requireSupabase()
  const { error } = await supabase.from('comerciales').delete().eq('id', comercialId)
  if (error) throw error
}

export async function actualizarComercialCamionero(camioneroId, comercialId, comisionPct = undefined) {
  requireSupabase()
  const payload = {}
  if (comercialId !== undefined) payload.comercial_id = comercialId || null
  if (comisionPct !== undefined) {
    if (comisionPct === null || comisionPct === '') {
      payload.comision_pct = null
    } else {
      const pct = Number(comisionPct)
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        throw new Error('El porcentaje debe estar entre 0 y 100.')
      }
      payload.comision_pct = pct
    }
  }
  if (!Object.keys(payload).length) return
  const { error } = await supabase.from('camioneros').update(payload).eq('id', camioneroId)
  if (error) throw error
}

export async function guardarPrestamistaConfig(datos) {
  requireSupabase()
  const row = {
    id: 1,
    razon_social: String(datos?.razon_social || '').trim(),
    cuit: String(datos?.cuit || '').trim(),
    domicilio: String(datos?.domicilio || '').trim(),
    email_legal: String(datos?.email_legal || '').trim(),
    telefono: String(datos?.telefono || '').trim(),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('prestamista_config').upsert(row, { onConflict: 'id' }).select().single()
  if (error) throw error
  return {
    razon_social: data.razon_social || '',
    cuit: data.cuit || '',
    domicilio: data.domicilio || '',
    email_legal: data.email_legal || '',
    telefono: data.telefono || '',
  }
}

// ─── CAMIONEROS ───────────────────────────────────────────────

export async function registrarCamionero(datos) {
  requireSupabase()
  const payload = { ...(datos || {}) }
  if (payload.password != null) payload.password = String(payload.password)
  const { data, error } = await supabase.from('camioneros').insert([payload]).select().single()
  if (error) throw error
  return data
}

export async function obtenerCamioneroPorEmail(email) {
  requireSupabase()
  const { data, error } = await supabase
    .from('camioneros')
    .select('*, comerciales(id, nombre, apellido, porcentaje_comision)')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    const err = new Error('No encontrado')
    err.code = 'not_found'
    throw err
  }
  return data
}

export async function solicitarResetPassword(emailRaw) {
  const email = String(emailRaw || '')
    .trim()
    .toLowerCase()
  if (!email) return { sent: false }

  requireSupabase()

  const { data: c, error: qErr } = await supabase
    .from('camioneros')
    .select('id,email,nombre,email_verificado')
    .eq('email', email)
    .maybeSingle()
  if (qErr) throw qErr
  if (!c?.id || !c.email_verificado) return { sent: false }

  const token =
    (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) +
    (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
  const password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error: uErr } = await supabase
    .from('camioneros')
    .update({ password_reset_token: token, password_reset_expires_at })
    .eq('id', c.id)
  if (uErr) throw uErr

  return {
    sent: true,
    email: c.email,
    nombre: c.nombre || '',
    token,
  }
}

export async function restablecerPasswordConToken(token, newPassword) {
  requireSupabase()
  const t = String(token || '').trim()
  if (!t) throw new Error('Enlace inválido.')
  if (!newPassword || String(newPassword).length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }

  const { data: c, error: qErr } = await supabase
    .from('camioneros')
    .select('id,password_reset_expires_at')
    .eq('password_reset_token', t)
    .maybeSingle()
  if (qErr) throw qErr
  if (!c?.id) throw new Error('El enlace no es válido o ya fue usado.')
  if (!c.password_reset_expires_at || new Date(c.password_reset_expires_at) < new Date()) {
    throw new Error('El enlace expiró. Solicitá uno nuevo desde el login.')
  }

  const { error: uErr } = await supabase
    .from('camioneros')
    .update({
      password: String(newPassword),
      password_reset_token: null,
      password_reset_expires_at: null,
    })
    .eq('id', c.id)
  if (uErr) throw uErr
}

export async function actualizarDniFotosCamionero(camioneroId, { dni_frente_url, dni_dorso_url }) {
  requireSupabase()
  const payload = {}
  if (dni_frente_url != null) payload.dni_frente_url = dni_frente_url
  if (dni_dorso_url != null) payload.dni_dorso_url = dni_dorso_url
  if (!Object.keys(payload).length) return
  const { error } = await supabase.from('camioneros').update(payload).eq('id', camioneroId)
  if (error) throw error
}

export async function actualizarCbuCvuCamionero(camioneroId, cbu_cvu) {
  requireSupabase()
  const v = String(cbu_cvu ?? '')
    .replace(/\D/g, '')
    .slice(0, 22)
  const { error } = await supabase.from('camioneros').update({ cbu_cvu: v || null }).eq('id', camioneroId)
  if (error) throw error
}

export async function actualizarDomicilioCamionero(camioneroId, domicilio) {
  requireSupabase()
  const v = String(domicilio ?? '').trim() || null
  const { error } = await supabase.from('camioneros').update({ domicilio: v }).eq('id', camioneroId)
  if (error) throw error
}

export async function actualizarDatosCamionero(camioneroId, datos) {
  requireSupabase()
  const payload = {}

  const nombre = datos?.nombre != null ? String(datos.nombre).trim() : ''
  const apellido = datos?.apellido != null ? String(datos.apellido).trim() : ''
  const celular = datos?.celular != null ? String(datos.celular).trim() : ''
  const dni = datos?.dni != null ? String(datos.dni).replace(/\D/g, '').trim() : ''
  const cuit = datos?.cuit != null ? String(datos.cuit).replace(/\D/g, '').trim() : ''
  const email = datos?.email != null ? String(datos.email).trim().toLowerCase() : ''

  if (datos?.nombre != null) payload.nombre = nombre
  if (datos?.apellido != null) payload.apellido = apellido
  if (datos?.celular != null) payload.celular = celular
  if (datos?.dni != null) payload.dni = dni
  if (datos?.cuit != null) payload.cuit = cuit
  if (datos?.email != null) payload.email = email

  if (!Object.keys(payload).length) return

  const { error } = await supabase.from('camioneros').update(payload).eq('id', camioneroId)
  if (error) throw error
}

export async function verificarEmail(camioneroId) {
  requireSupabase()
  const { error } = await supabase
    .from('camioneros')
    .update({ email_verificado: true })
    .eq('id', camioneroId)
  if (error) throw error
}

export async function listarCamioneros() {
  requireSupabase()
  const { data, error } = await supabase
    .from('camioneros')
    .select('*, solicitudes(count), comerciales(id, nombre, apellido, porcentaje_comision)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── SOLICITUDES ──────────────────────────────────────────────

export async function crearSolicitud(datos) {
  requireSupabase()
  const { data, error } = await supabase
    .from('solicitudes')
    .insert([datos])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listarSolicitudes({ busqueda, estado, desde, hasta } = {}) {
  requireSupabase()
  let query = supabase
    .from('solicitudes')
    .select(`
      *,
      camioneros (
        nombre, apellido, dni, cuit, celular, email, comercial_id, comision_pct,
        comerciales ( id, nombre, apellido, porcentaje_comision )
      )
    `)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta + 'T23:59:59')
  if (busqueda) {
    query = query.or(
      `numero.ilike.%${busqueda}%,numero_echeq.ilike.%${busqueda}%,banco_emisor.ilike.%${busqueda}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function obtenerSolicitudesDeCamionero(camioneroId) {
  requireSupabase()
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('camionero_id', camioneroId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function actualizarEstado(solicitudId, estado) {
  requireSupabase()
  const { error } = await supabase
    .from('solicitudes')
    .update({ estado })
    .eq('id', solicitudId)
  if (error) throw error
}

export async function aprobarSolicitudConCuenta(solicitudId, cuenta) {
  requireSupabase()
  const { data, error } = await supabase
    .from('solicitudes')
    .update({
      estado: 'aprobado',
      cuenta_destino_id: cuenta?.id || null,
      cuenta_destino_alias: cuenta?.alias || null,
      cuenta_destino_titular: cuenta?.titular || null,
      cuenta_destino_cvu: null,
      cuenta_destino_cuit: cuenta?.cuit || null,
      cuenta_destino_librador: null,
      cuenta_destino_banco: cuenta?.banco || null,
    })
    .eq('id', solicitudId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listarCuentasDestino() {
  requireSupabase()
  const { data, error } = await supabase
    .from('cuentas_destino')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

function normalizarCuit(cuit) {
  return String(cuit ?? '')
    .replace(/\D/g, '')
    .slice(0, 11)
}

function validarDatosCuentaDestino(datos) {
  const titular = String(datos?.titular ?? '').trim()
  const alias = String(datos?.alias ?? '').trim()
  const cuit = normalizarCuit(datos?.cuit)
  const banco = String(datos?.banco ?? '').trim()
  if (!titular) throw new Error('El titular es obligatorio.')
  if (!alias) throw new Error('El alias es obligatorio.')
  if (!banco) throw new Error('El banco es obligatorio.')
  if (cuit.length !== 11) throw new Error('El CUIT debe tener 11 dígitos.')
  return { titular, alias, cuit, banco }
}

export async function crearCuentaDestino(datos) {
  requireSupabase()
  const v = validarDatosCuentaDestino(datos)
  const payload = {
    alias: v.alias,
    titular: v.titular,
    cuit: v.cuit,
    banco: v.banco || null,
    activa: true,
  }
  const { data, error } = await supabase
    .from('cuentas_destino')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarCuentaDestino(cuentaId, datos) {
  requireSupabase()
  const v = validarDatosCuentaDestino(datos)
  const payload = {
    alias: v.alias,
    titular: v.titular,
    cuit: v.cuit,
    banco: v.banco || null,
  }
  const { data, error } = await supabase
    .from('cuentas_destino')
    .update(payload)
    .eq('id', cuentaId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarCuentaDestino(cuentaId) {
  requireSupabase()
  const { error } = await supabase
    .from('cuentas_destino')
    .delete()
    .eq('id', cuentaId)
  if (error) throw error
}

// ─── STORAGE (Cloudinary via fetch) ───────────────────────────

export async function subirImagenCloudinary(archivo, carpeta = 'dni') {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `pago-nacional/${carpeta}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('Error subiendo imagen a Cloudinary')
  const json = await res.json()
  return json.secure_url
}

// ─── STATS PARA ADMIN ─────────────────────────────────────────

export async function obtenerStats() {
  requireSupabase()
  const { data, error } = await supabase
    .from('solicitudes')
    .select('estado,monto')
  if (error) throw error

  const total = data.length
  const pendiente = data.filter(s => s.estado === 'pendiente').length
  const aprobado = data.filter(s => s.estado === 'aprobado').length
  const rechazado = data.filter(s => s.estado === 'rechazado').length
  const monto_total = data.reduce((acc, s) => acc + (Number(s.monto) || 0), 0)
  const monto_aprobado = data.reduce(
    (acc, s) => acc + (s.estado === 'aprobado' ? (Number(s.monto) || 0) : 0),
    0
  )

  return { total, pendiente, aprobado, rechazado, monto_total, monto_aprobado }
}
