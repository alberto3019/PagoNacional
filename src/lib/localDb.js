const LS_KEY = 'pago_nacional_db_v1'
const IDB_NAME = 'pago_nacional_local'
const IDB_VER = 1
const IDB_STORE = 'kv'

function emptyDb() {
  return { camioneros: [], solicitudes: [], cuentas: [] }
}

function parseDb(raw) {
  if (!raw) return emptyDb()
  try {
    const parsed = JSON.parse(raw)
    return {
      camioneros: Array.isArray(parsed.camioneros) ? parsed.camioneros : [],
      solicitudes: Array.isArray(parsed.solicitudes) ? parsed.solicitudes : [],
      cuentas: Array.isArray(parsed.cuentas) ? parsed.cuentas : [],
    }
  } catch {
    return emptyDb()
  }
}

function openIdb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este navegador.'))
      return
    }
    const req = indexedDB.open(IDB_NAME, IDB_VER)
    req.onerror = () => reject(req.error || new Error('No se pudo abrir IndexedDB.'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE)
    }
  })
}

async function idbGet(key) {
  const db = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const r = tx.objectStore(IDB_STORE).get(key)
    r.onsuccess = () => resolve(r.result ?? null)
    r.onerror = () => reject(r.error)
  })
}

async function idbSet(key, value) {
  const db = await openIdb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada.'))
  })
}

async function idbDelete(key) {
  try {
    const db = await openIdb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error || new Error('Transacción abortada.'))
    })
  } catch {
    /* noop si IDB no existe */
  }
}

/** Carga desde IndexedDB; migra una vez desde localStorage si hace falta. */
async function load() {
  try {
    const fromIdb = await idbGet(LS_KEY)
    if (typeof fromIdb === 'string' && fromIdb.length > 0) return parseDb(fromIdb)
  } catch (e) {
    console.warn('localDb: falló lectura IndexedDB, probando localStorage.', e)
  }

  const legacy = localStorage.getItem(LS_KEY)
  if (legacy) {
    try {
      await idbSet(LS_KEY, legacy)
      localStorage.removeItem(LS_KEY)
    } catch (e) {
      console.warn('localDb: no se pudo migrar a IndexedDB.', e)
    }
    return parseDb(legacy)
  }

  return emptyDb()
}

async function save(db) {
  const str = JSON.stringify(db)
  try {
    await idbSet(LS_KEY, str)
    localStorage.removeItem(LS_KEY)
    return
  } catch (e) {
    console.warn('localDb: falló guardado IndexedDB, probando localStorage.', e)
  }
  try {
    localStorage.setItem(LS_KEY, str)
  } catch (e) {
    const msg =
      e?.name === 'QuotaExceededError' || String(e?.message || '').includes('quota')
        ? 'Se llenó el espacio del navegador. Configurá Cloudinary en .env para subir las fotos del DNI en lugar de guardarlas en el dispositivo, o borrá datos antiguos del sitio.'
        : 'No se pudo guardar la base local.'
    throw new Error(msg)
  }
}

function nowIso() {
  return new Date().toISOString()
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id_' + Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function normalize(str) {
  return String(str || '').trim()
}

function genNumeroSolicitud() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PN-${y}${m}${day}-${rnd}`
}

export async function localDbReset() {
  localStorage.removeItem(LS_KEY)
  await idbDelete(LS_KEY)
}

// ─── CAMIONEROS ───────────────────────────────────────────────

export async function registrarCamioneroLocal(datos) {
  const db = await load()
  const email = normalize(datos.email).toLowerCase()
  const dni = normalize(datos.dni)

  if (!email) throw new Error('Email inválido.')
  if (!datos.password) throw new Error('La contraseña es obligatoria.')

  const dup = db.camioneros.find(
    c => c.email?.toLowerCase() === email || (dni && c.dni === dni)
  )
  if (dup) {
    const err = new Error('duplicate')
    err.code = 'duplicate'
    throw err
  }

  const camionero = {
    id: uuid(),
    nombre: normalize(datos.nombre),
    apellido: normalize(datos.apellido),
    dni,
    cuit: normalize(datos.cuit),
    celular: normalize(datos.celular),
    email,
    password: String(datos.password),
    email_verificado: false,
    dni_frente_url: normalize(datos.dni_frente_url),
    dni_dorso_url: normalize(datos.dni_dorso_url),
    cbu_cvu: normalize(datos.cbu_cvu),
    created_at: nowIso(),
  }

  db.camioneros.unshift(camionero)
  await save(db)
  return camionero
}

export async function obtenerCamioneroPorEmailLocal(email) {
  const db = await load()
  const e = normalize(email).toLowerCase()
  const c = db.camioneros.find(x => x.email?.toLowerCase() === e)
  if (!c) {
    const err = new Error('No encontrado')
    err.code = 'not_found'
    throw err
  }
  return c
}

export async function verificarEmailLocal(camioneroId) {
  const db = await load()
  const idx = db.camioneros.findIndex(c => c.id === camioneroId)
  if (idx === -1) throw new Error('Camionero no encontrado.')
  db.camioneros[idx].email_verificado = true
  await save(db)
}

const RESET_TTL_MS = 60 * 60 * 1000

export async function solicitarResetPasswordLocal(email) {
  const db = await load()
  const e = normalize(email).toLowerCase()
  const idx = db.camioneros.findIndex(c => c.email?.toLowerCase() === e)
  if (idx === -1) return { sent: false }
  const c = db.camioneros[idx]
  if (!c.email_verificado) return { sent: false }
  const token =
    (globalThis.crypto?.randomUUID?.() || uuid()) + (globalThis.crypto?.randomUUID?.() || uuid())
  const expires = new Date(Date.now() + RESET_TTL_MS).toISOString()
  db.camioneros[idx].password_reset_token = token
  db.camioneros[idx].password_reset_expires_at = expires
  await save(db)
  return {
    sent: true,
    email: c.email,
    nombre: c.nombre || '',
    token,
  }
}

export async function restablecerPasswordConTokenLocal(token, newPassword) {
  const t = normalize(token)
  if (!t) throw new Error('Enlace inválido.')
  if (!newPassword || String(newPassword).length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }
  const db = await load()
  const idx = db.camioneros.findIndex(c => c.password_reset_token === t)
  if (idx === -1) throw new Error('El enlace no es válido o ya fue usado.')
  const exp = db.camioneros[idx].password_reset_expires_at
  if (!exp || new Date(exp) < new Date()) {
    throw new Error('El enlace expiró. Solicitá uno nuevo desde el login.')
  }
  db.camioneros[idx].password = String(newPassword)
  db.camioneros[idx].password_reset_token = ''
  db.camioneros[idx].password_reset_expires_at = ''
  await save(db)
}

export async function actualizarDniFotosCamioneroLocal(camioneroId, { dni_frente_url, dni_dorso_url }) {
  const db = await load()
  const idx = db.camioneros.findIndex(c => c.id === camioneroId)
  if (idx === -1) throw new Error('Camionero no encontrado.')
  if (dni_frente_url != null) db.camioneros[idx].dni_frente_url = normalize(dni_frente_url)
  if (dni_dorso_url != null) db.camioneros[idx].dni_dorso_url = normalize(dni_dorso_url)
  await save(db)
}

export async function actualizarCbuCvuCamioneroLocal(camioneroId, cbu_cvu) {
  const db = await load()
  const idx = db.camioneros.findIndex(c => c.id === camioneroId)
  if (idx === -1) throw new Error('Camionero no encontrado.')
  db.camioneros[idx].cbu_cvu = normalize(cbu_cvu)
  await save(db)
}

export async function listarCamionerosLocal() {
  const db = await load()
  // compat con select('*, solicitudes(count)') del admin
  return db.camioneros.map(c => ({
    ...c,
    solicitudes: { count: db.solicitudes.filter(s => s.camionero_id === c.id).length },
  }))
}

// ─── SOLICITUDES ──────────────────────────────────────────────

export async function crearSolicitudLocal(datos) {
  const db = await load()
  const camionero = db.camioneros.find(c => c.id === datos.camionero_id)
  if (!camionero) throw new Error('Camionero no encontrado.')

  const solicitud = {
    id: uuid(),
    numero: genNumeroSolicitud(),
    camionero_id: datos.camionero_id,
    cbu_cvu: normalize(datos.cbu_cvu),
    numero_echeq: normalize(datos.numero_echeq),
    monto: Number(datos.monto || 0),
    banco_emisor: normalize(datos.banco_emisor),
    fecha_vencimiento: normalize(datos.fecha_vencimiento),
    dni_frente_url: normalize(datos.dni_frente_url),
    dni_dorso_url: normalize(datos.dni_dorso_url),
    tc_aceptado: !!datos.tc_aceptado,
    terminos_html: typeof datos.terminos_html === 'string' ? datos.terminos_html : '',
    terminos_aceptados_at: typeof datos.terminos_aceptados_at === 'string' ? datos.terminos_aceptados_at : nowIso(),
    cuenta_destino_id: normalize(datos.cuenta_destino_id),
    cuenta_destino_alias: normalize(datos.cuenta_destino_alias),
    cuenta_destino_titular: normalize(datos.cuenta_destino_titular),
    cuenta_destino_cvu: normalize(datos.cuenta_destino_cvu),
    cuenta_destino_banco: normalize(datos.cuenta_destino_banco),
    estado: 'pendiente',
    created_at: nowIso(),
  }

  db.solicitudes.unshift(solicitud)
  await save(db)
  return solicitud
}

export async function listarSolicitudesLocal({ busqueda, estado, desde, hasta } = {}) {
  const db = await load()
  const q = normalize(busqueda).toLowerCase()

  let rows = [...db.solicitudes]
  if (estado) rows = rows.filter(s => s.estado === estado)
  if (desde) rows = rows.filter(s => s.created_at >= desde)
  if (hasta) rows = rows.filter(s => s.created_at <= `${hasta}T23:59:59`)

  if (q) {
    rows = rows.filter(s => {
      const cam = db.camioneros.find(c => c.id === s.camionero_id) || {}
      return (
        String(s.numero || '').toLowerCase().includes(q) ||
        String(s.numero_echeq || '').toLowerCase().includes(q) ||
        String(s.banco_emisor || '').toLowerCase().includes(q) ||
        String(cam.nombre || '').toLowerCase().includes(q) ||
        String(cam.apellido || '').toLowerCase().includes(q) ||
        String(cam.dni || '').toLowerCase().includes(q)
      )
    })
  }

  return rows.map(s => ({
    ...s,
    camioneros: db.camioneros.find(c => c.id === s.camionero_id) || null,
  }))
}

export async function obtenerSolicitudesDeCamioneroLocal(camioneroId) {
  const db = await load()
  return db.solicitudes
    .filter(s => s.camionero_id === camioneroId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function actualizarEstadoLocal(solicitudId, estado) {
  const db = await load()
  const idx = db.solicitudes.findIndex(s => s.id === solicitudId)
  if (idx === -1) throw new Error('Solicitud no encontrada.')
  db.solicitudes[idx].estado = estado
  await save(db)
}

export async function aprobarSolicitudConCuentaLocal(solicitudId, cuenta) {
  const db = await load()
  const idx = db.solicitudes.findIndex(s => s.id === solicitudId)
  if (idx === -1) throw new Error('Solicitud no encontrada.')
  if (!cuenta?.id) throw new Error('Debes seleccionar una cuenta destino.')
  db.solicitudes[idx].estado = 'aprobado'
  db.solicitudes[idx].cuenta_destino_id = cuenta.id
  db.solicitudes[idx].cuenta_destino_alias = cuenta.alias || ''
  db.solicitudes[idx].cuenta_destino_titular = cuenta.titular || ''
  db.solicitudes[idx].cuenta_destino_cvu = cuenta.cvu || cuenta.cbu || ''
  db.solicitudes[idx].cuenta_destino_banco = cuenta.banco || ''
  db.solicitudes[idx].aprobado_at = nowIso()
  await save(db)
  return db.solicitudes[idx]
}

// ─── CUENTAS DESTINO ───────────────────────────────────────────
export async function listarCuentasDestinoLocal() {
  const db = await load()
  return [...db.cuentas].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function crearCuentaDestinoLocal(datos) {
  const db = await load()
  const cuenta = {
    id: uuid(),
    alias: normalize(datos.alias),
    titular: normalize(datos.titular),
    cbu: normalize(datos.cbu),
    cvu: normalize(datos.cvu),
    banco: normalize(datos.banco),
    activa: true,
    created_at: nowIso(),
  }
  if (!cuenta.titular) throw new Error('El titular es obligatorio.')
  if (!cuenta.alias) throw new Error('El alias es obligatorio.')
  if (!cuenta.banco) throw new Error('El banco es obligatorio.')
  if (!cuenta.cbu && !cuenta.cvu) throw new Error('Debés ingresar al menos un CBU o un CVU.')
  db.cuentas.unshift(cuenta)
  await save(db)
  return cuenta
}

export async function actualizarCuentaDestinoLocal(cuentaId, datos) {
  const db = await load()
  const idx = db.cuentas.findIndex(c => c.id === cuentaId)
  if (idx === -1) throw new Error('Cuenta no encontrada.')
  const next = {
    ...db.cuentas[idx],
    titular: normalize(datos.titular),
    alias: normalize(datos.alias),
    cbu: normalize(datos.cbu),
    cvu: normalize(datos.cvu),
    banco: normalize(datos.banco),
  }
  if (!next.titular) throw new Error('El titular es obligatorio.')
  if (!next.alias) throw new Error('El alias es obligatorio.')
  if (!next.banco) throw new Error('El banco es obligatorio.')
  if (!next.cbu && !next.cvu) throw new Error('Debés ingresar al menos un CBU o un CVU.')
  db.cuentas[idx] = next
  await save(db)
  return next
}

export async function eliminarCuentaDestinoLocal(cuentaId) {
  const db = await load()
  const used = db.solicitudes.some(s => s.cuenta_destino_id === cuentaId)
  if (used) throw new Error('No se puede eliminar: la cuenta ya fue usada en solicitudes.')
  const before = db.cuentas.length
  db.cuentas = db.cuentas.filter(c => c.id !== cuentaId)
  if (db.cuentas.length === before) throw new Error('Cuenta no encontrada.')
  await save(db)
}

export async function obtenerStatsLocal() {
  const db = await load()
  const total = db.solicitudes.length
  const pendiente = db.solicitudes.filter(s => s.estado === 'pendiente').length
  const aprobado = db.solicitudes.filter(s => s.estado === 'aprobado').length
  const rechazado = db.solicitudes.filter(s => s.estado === 'rechazado').length
  const monto_total = db.solicitudes.reduce((acc, s) => acc + (Number(s.monto) || 0), 0)
  const monto_aprobado = db.solicitudes.reduce(
    (acc, s) => acc + (s.estado === 'aprobado' ? (Number(s.monto) || 0) : 0),
    0
  )
  return { total, pendiente, aprobado, rechazado, monto_total, monto_aprobado }
}

