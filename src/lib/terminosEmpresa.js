// Datos del prestamista para Términos y contratos.
// Se persisten en Supabase (tabla prestamista_config). Las VITE_PRESTAMISTA_* del .env actúan como respaldo si la fila está vacía.

import { obtenerPrestamistaConfig, guardarPrestamistaConfig } from './supabase.js'

function defaultsFromEnv() {
  return {
    razon_social: import.meta.env.VITE_PRESTAMISTA_NOMBRE || '',
    cuit: import.meta.env.VITE_PRESTAMISTA_CUIT || '',
    domicilio: import.meta.env.VITE_PRESTAMISTA_DOMICILIO || '',
    email_legal: import.meta.env.VITE_PRESTAMISTA_EMAIL || '',
    telefono: import.meta.env.VITE_PRESTAMISTA_TELEFONO || '',
  }
}

/** undefined = aún no se cargó desde Supabase. */
let cachedRow
let loadPromise = null

export async function ensurePrestamistaLoaded() {
  if (cachedRow !== undefined) return
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      cachedRow = await obtenerPrestamistaConfig()
    } catch (e) {
      console.warn('prestamista_config:', e)
      cachedRow = {
        razon_social: '',
        cuit: '',
        domicilio: '',
        email_legal: '',
        telefono: '',
      }
    } finally {
      loadPromise = null
    }
  })()
  return loadPromise
}

export function obtenerTerminosEmpresaParaFormulario() {
  return {
    razon_social: '',
    cuit: '',
    domicilio: '',
    email_legal: '',
    telefono: '',
    ...defaultsFromEnv(),
    ...(cachedRow || {}),
  }
}

export async function guardarTerminosEmpresa(datos) {
  const next = {
    razon_social: String(datos?.razon_social || '').trim(),
    cuit: String(datos?.cuit || '').trim(),
    domicilio: String(datos?.domicilio || '').trim(),
    email_legal: String(datos?.email_legal || '').trim(),
    telefono: String(datos?.telefono || '').trim(),
  }
  cachedRow = await guardarPrestamistaConfig(next)
  return next
}

export function datosPrestamistaParaTerminos() {
  const d = { ...defaultsFromEnv(), ...(cachedRow || {}) }
  return {
    nombre: (d.razon_social || '').trim() || 'PAGO NACIONAL',
    cuit: (d.cuit || '').trim() || 'NO INFORMADO',
    domicilio: (d.domicilio || '').trim() || 'NO INFORMADO',
  }
}
