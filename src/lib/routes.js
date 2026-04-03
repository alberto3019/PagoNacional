// Rutas sin .html para producción (www) y dev (Vite reescribe al HTML real).

const ROUTE_FILES = [
  ['login', 'login'],
  ['registro', 'registro'],
  ['home', 'home'],
  ['admin', 'admin'],
  ['solicitud', 'solicitud'],
  ['perfil', 'perfil'],
  ['terminos', 'terminos'],
  ['verificar', 'verificar'],
  ['verificarPendiente', 'verificar-pendiente'],
  ['recuperarClave', 'recuperar-clave'],
  ['restablecerClave', 'restablecer-clave'],
  ['cuenta', 'cuenta'],
  ['confirmacion', 'confirmacion'],
]

/** @type {Record<string, string>} */
export const routes = Object.fromEntries(ROUTE_FILES.map(([key, file]) => [key, `/${file}`]))

/** Mapa path limpio → HTML para el middleware de Vite en desarrollo */
export const cleanPathToDevHtml = Object.fromEntries(
  ROUTE_FILES.map(([, file]) => [`/${file}`, `/src/pages/${file}.html`])
)

export function emailBaseUrl() {
  return String(import.meta.env.VITE_APP_URL || '').replace(/\/$/, '')
}

/** URL absoluta del panel admin (emails) */
export function adminPanelAbsoluteUrl() {
  const b = emailBaseUrl()
  return b ? `${b}${routes.admin}` : routes.admin
}
