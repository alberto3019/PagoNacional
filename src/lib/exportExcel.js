// src/lib/exportExcel.js
import * as XLSX from 'xlsx'

export function exportarSolicitudes(solicitudes, nombreArchivo = 'pago-nacional-solicitudes') {
  const filas = solicitudes.map(s => ({
    'N° Solicitud':   s.numero,
    'N° Echeq':       s.numero_echeq,
    'Nombre':         s.camioneros?.nombre || '',
    'Apellido':       s.camioneros?.apellido || '',
    'DNI':            s.camioneros?.dni || '',
    'CUIT':           s.camioneros?.cuit || '',
    'Email':          s.camioneros?.email || '',
    'Celular':        s.camioneros?.celular || '',
    'Domicilio':      s.camioneros?.domicilio || '',
    'Comercial': (() => {
      const co = s.camioneros?.comerciales
      if (co?.nombre != null) return `${co.nombre || ''} ${co.apellido || ''}`.trim()
      return 'Pago Nacional (por defecto)'
    })(),
    '% comisión': s.liq_comision_pct ?? s.camioneros?.comision_pct ?? s.camioneros?.comerciales?.porcentaje_comision ?? '',
    'CBU/CVU solicitud': s.cbu_cvu,
    'Domicilio declarado': s.domicilio_declarado || s.camioneros?.domicilio || '',
    'CUIT de Librador (echeq)': s.librador || '',
    'CUIT asignación': s.cuenta_destino_cuit || '',
    'Monto':          s.monto,
    'Banco emisor':   s.banco_emisor,
    'Vencimiento':    s.fecha_vencimiento,
    'Estado':         s.estado,
    'Fecha solicitud': new Date(s.created_at).toLocaleDateString('es-AR'),
  }))

  const ws = XLSX.utils.json_to_sheet(filas)

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 26 }, { wch: 18 },
    { wch: 28 }, { wch: 22 }, { wch: 28 }, { wch: 10 },
    { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes')
  XLSX.writeFile(wb, `${nombreArchivo}-${new Date().toISOString().slice(0,10)}.xlsx`)
}

export function exportarCamioneros(camioneros) {
  const filas = camioneros.map(c => ({
    'Nombre':           c.nombre,
    'Apellido':         c.apellido,
    'DNI':              c.dni,
    'CUIT':             c.cuit,
    'Email':            c.email,
    'Celular':          c.celular,
    'Domicilio':        c.domicilio || '',
    'Email verificado': c.email_verificado ? 'Si' : 'No',
    'Fecha registro':   new Date(c.created_at).toLocaleDateString('es-AR'),
    'Comercial': (() => {
      const co = c.comerciales
      if (co?.nombre != null) return `${co.nombre || ''} ${co.apellido || ''}`.trim()
      return 'Pago Nacional (por defecto)'
    })(),
    '% comisión': (() => {
      const ov = c.comision_pct
      if (ov != null && ov !== '') return Number(ov)
      return c.comerciales?.porcentaje_comision ?? ''
    })(),
    '% personalizado': c.comision_pct != null && c.comision_pct !== '' ? 'Sí' : 'No',
  }))

  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = [
    { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
    { wch: 26 }, { wch: 18 }, { wch: 28 }, { wch: 16 },
    { wch: 16 }, { wch: 28 }, { wch: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Camioneros')
  XLSX.writeFile(wb, `pago-nacional-camioneros-${new Date().toISOString().slice(0,10)}.xlsx`)
}
