// Cálculo de lo que recibe el camionero por gestión: comisión % sobre el monto y gasto administrativo fijo.

/**
 * @param {number|string} montoBruto
 * @param {number|string} porcentajeComision
 * @param {number|string} gastoAdministrativo
 */
export function calcularLiquidacionGestion(montoBruto, porcentajeComision, gastoAdministrativo) {
  const m = Number(montoBruto) || 0
  const pct = Math.max(0, Number(porcentajeComision) || 0)
  const gasto = Math.max(0, Number(gastoAdministrativo) || 0)
  const comisionMonto = Math.round(m * (pct / 100) * 100) / 100
  const trasComision = Math.round((m - comisionMonto) * 100) / 100
  const neto = Math.round((trasComision - gasto) * 100) / 100
  return { montoBruto: m, porcentajeComision: pct, comisionMonto, trasComision, gastoAdministrativo: gasto, neto }
}

/**
 * @param {object|null} camionero fila con join opcional `comerciales`
 * @param {object|null} finanzas fila `finanzas_config`
 */
export function resolverComisionYEtiqueta(camionero, finanzas) {
  const co = camionero?.comerciales
  if (co && typeof co === 'object' && co.id) {
    const nombre = `${String(co.nombre || '').trim()} ${String(co.apellido || '').trim()}`.trim()
    return {
      etiqueta: nombre || 'Comercial',
      porcentaje: Number(co.porcentaje_comision) || 0,
      esPagoNacional: false,
    }
  }
  const def = Number(finanzas?.comision_pagonacional_pct)
  return {
    etiqueta: 'Pago Nacional',
    porcentaje: Number.isFinite(def) ? def : 10,
    esPagoNacional: true,
  }
}

/**
 * Objeto listo para emails (confirmación / aprobación).
 * @param {object|null} camionero
 * @param {object|null} finanzas
 * @param {number|string} montoSolicitud
 */
export function armarLiquidacionParaEmail(camionero, finanzas, montoSolicitud) {
  const { etiqueta, porcentaje } = resolverComisionYEtiqueta(camionero, finanzas)
  const gasto = Number(finanzas?.gasto_administrativo) || 0
  const r = calcularLiquidacionGestion(montoSolicitud, porcentaje, gasto)
  return {
    comercialNombre: etiqueta,
    porcentajeComision: r.porcentajeComision,
    montoComision: r.comisionMonto,
    montoTrasComision: r.trasComision,
    gastoAdministrativo: r.gastoAdministrativo,
    netoEstimado: r.neto,
    montoSolicitud: r.montoBruto,
  }
}
