/**
 * Genera un PDF desde el HTML completo del contrato (misma vista que aceptó el camionero).
 * Solo en navegador; usa iframe para respetar estilos del documento.
 */
export async function terminosHtmlToPdfBase64(fullHtml) {
  if (!fullHtml || !String(fullHtml).trim()) return null
  const html2pdf = (await import('html2pdf.js')).default

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'terminos-pdf')
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:210mm;min-height:200px;border:0;visibility:hidden;'
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) return null
    doc.open()
    doc.write(fullHtml)
    doc.close()

    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })

    const el = doc.body
    if (!el) return null

    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'Terminos-y-condiciones.pdf',
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }

    const blob = await html2pdf().set(opt).from(el).outputPdf('blob')
    return await blobToBase64DataPart(blob)
  } catch (e) {
    console.error('terminosHtmlToPdfBase64:', e)
    return null
  } finally {
    iframe.remove()
  }
}

function blobToBase64DataPart(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result || '')
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}
