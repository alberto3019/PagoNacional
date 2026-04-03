// Datos de la empresa (prestamista) para Términos y contratos.
// Prioridad: valores guardados en localStorage (panel admin) > variables VITE_* > texto por defecto.

const LS_KEY = 'pago_nacional_terminos_empresa_v1'

function defaultsFromEnv() {
  return {
    razon_social: import.meta.env.VITE_PRESTAMISTA_NOMBRE || '',
    cuit: import.meta.env.VITE_PRESTAMISTA_CUIT || '',
    domicilio: import.meta.env.VITE_PRESTAMISTA_DOMICILIO || '',
    email_legal: import.meta.env.VITE_PRESTAMISTA_EMAIL || '',
    telefono: import.meta.env.VITE_PRESTAMISTA_TELEFONO || '',
  }
}

function loadStored() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    return typeof p === 'object' && p ? p : null
  } catch {
    return null
  }
}

/** Para el formulario del admin: env + lo guardado (el guardado pisa env). */
export function obtenerTerminosEmpresaParaFormulario() {
  return {
    razon_social: '',
    cuit: '',
    domicilio: '',
    email_legal: '',
    telefono: '',
    ...defaultsFromEnv(),
    ...loadStored(),
  }
}

export function guardarTerminosEmpresa(datos) {
  const next = {
    razon_social: String(datos?.razon_social || '').trim(),
    cuit: String(datos?.cuit || '').trim(),
    domicilio: String(datos?.domicilio || '').trim(),
    email_legal: String(datos?.email_legal || '').trim(),
    telefono: String(datos?.telefono || '').trim(),
  }
  localStorage.setItem(LS_KEY, JSON.stringify(next))
  return next
}

/** Nombre, CUIT y domicilio que usan términos y el HTML del contrato en solicitud. */
export function datosPrestamistaParaTerminos() {
  const d = { ...defaultsFromEnv(), ...loadStored() }
  return {
    nombre: (d.razon_social || '').trim() || 'PAGO NACIONAL',
    cuit: (d.cuit || '').trim() || 'NO INFORMADO',
    domicilio: (d.domicilio || '').trim() || 'NO INFORMADO',
  }
}
