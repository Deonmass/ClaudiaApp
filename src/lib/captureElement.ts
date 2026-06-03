import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

/** Largeur de rendu alignée sur une page A4 paysage pleine largeur */
export const PDF_LANDSCAPE_CONTENT_WIDTH_PX = 1440

function safeFilename(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return cleaned || 'projet'
}

type StyleSnapshot = {
  el: HTMLElement
  props: Record<string, string>
}

const LAYOUT_PROPS = [
  'width',
  'max-width',
  'height',
  'max-height',
  'min-height',
  'overflow',
  'overflow-y',
  'overflow-x',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
] as const

function snapshotStyles(el: HTMLElement, keys: readonly string[]): StyleSnapshot {
  const props: Record<string, string> = {}
  for (const key of keys) {
    props[key] = el.style.getPropertyValue(key)
  }
  return { el, props }
}

function restoreStyles({ el, props }: StyleSnapshot): void {
  for (const [key, value] of Object.entries(props)) {
    if (value) el.style.setProperty(key, value)
    else el.style.removeProperty(key)
  }
}

/** Déplie scroll / flex sur le DOM réel pour éviter les zones grises vides à la capture. */
function prepareElementForCapture(root: HTMLElement): () => void {
  const snapshots: StyleSnapshot[] = []

  const touch = (el: HTMLElement, overrides: Record<string, string>) => {
    snapshots.push(snapshotStyles(el, LAYOUT_PROPS))
    for (const [key, value] of Object.entries(overrides)) {
      el.style.setProperty(key, value)
    }
  }

  touch(root, {
    width: `${PDF_LANDSCAPE_CONTENT_WIDTH_PX}px`,
    'max-width': `${PDF_LANDSCAPE_CONTENT_WIDTH_PX}px`,
    height: 'auto',
    'max-height': 'none',
    overflow: 'visible',
  })

  root.querySelectorAll<HTMLElement>('[data-capture-flex-fill]').forEach((el) => {
    touch(el, {
      flex: 'none',
      'flex-grow': '0',
      'flex-shrink': '0',
      'min-height': 'auto',
      overflow: 'visible',
    })
  })

  root.querySelectorAll<HTMLElement>('[data-capture-scroll]').forEach((el) => {
    touch(el, {
      overflow: 'visible',
      height: 'auto',
      'max-height': 'none',
      'min-height': 'auto',
      flex: 'none',
    })
  })

  root.querySelectorAll<HTMLElement>('[data-capture-hide]').forEach((el) => {
    snapshots.push(snapshotStyles(el, ['visibility']))
    el.style.setProperty('visibility', 'hidden')
  })

  return () => {
    for (let i = snapshots.length - 1; i >= 0; i--) {
      restoreStyles(snapshots[i])
    }
  }
}

function polishCloneForCapture(doc: Document, cloned: HTMLElement): void {
  const view = doc.defaultView
  if (!view) return

  const isDark = document.documentElement.classList.contains('dark')
  const panelBg = isDark ? '#0f172a' : '#ffffff'
  const theadBg = isDark ? '#1e293b' : '#f8fafc'

  cloned.style.boxShadow = 'none'
  cloned.style.filter = 'none'
  cloned.style.background = panelBg
  cloned.style.overflow = 'visible'
  cloned.style.height = 'auto'
  cloned.style.maxHeight = 'none'
  cloned.style.width = `${PDF_LANDSCAPE_CONTENT_WIDTH_PX}px`
  cloned.style.maxWidth = `${PDF_LANDSCAPE_CONTENT_WIDTH_PX}px`

  cloned.querySelectorAll<HTMLElement>('[data-capture-hide]').forEach((node) => {
    node.style.display = 'none'
  })

  cloned.querySelectorAll<HTMLElement>('[data-capture-scroll], [data-capture-flex-fill]').forEach(
    (node) => {
      node.style.overflow = 'visible'
      node.style.height = 'auto'
      node.style.maxHeight = 'none'
      node.style.minHeight = 'auto'
      node.style.flex = 'none'
    },
  )

  cloned.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const style = view.getComputedStyle(node)

    if (style.position === 'sticky' || style.position === 'fixed') {
      node.style.position = 'static'
    }

    if (style.boxShadow !== 'none') {
      node.style.boxShadow = 'none'
    }

    if (style.backdropFilter !== 'none') {
      node.style.backdropFilter = 'none'
    }

    const bg = style.backgroundColor
    if (bg.startsWith('rgba')) {
      const alpha = parseFloat(bg.split(',').at(-1)?.replace(')', '') ?? '1')
      const rgb = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (alpha < 1 && rgb) {
        const r = Number(rgb[1])
        const g = Number(rgb[2])
        const b = Number(rgb[3])
        const isNeutral = Math.abs(r - g) < 20 && Math.abs(g - b) < 20
        if (isNeutral) node.style.backgroundColor = panelBg
      }
    }
  })

  cloned.querySelectorAll<HTMLElement>('thead').forEach((thead) => {
    thead.style.position = 'static'
    thead.style.background = theadBg
  })
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const restore = prepareElementForCapture(element)
  await waitForLayout()

  const width = element.scrollWidth
  const height = element.scrollHeight
  const isDark = document.documentElement.classList.contains('dark')

  try {
    const canvas = await html2canvas(element, {
      scale: Math.min(2, window.devicePixelRatio || 2),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      onclone: (_doc, cloned) => polishCloneForCapture(_doc, cloned),
    })

    if (!canvas.width || !canvas.height) {
      throw new Error('Capture vide')
    }

    return canvas
  } finally {
    restore()
  }
}

function canvasToLandscapePdf(canvas: HTMLCanvasElement, filenameBase: string): void {
  const imgData = canvas.toDataURL('image/png', 1)
  if (!imgData || imgData === 'data:,') {
    throw new Error('Capture vide')
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage('a4', 'landscape')
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= pageHeight
  }

  pdf.save(`${safeFilename(filenameBase)}.pdf`)
}

/** Export PDF A4 paysage, image pleine largeur (pages suivantes si contenu long). */
export async function downloadElementPdf(
  element: HTMLElement,
  filenameBase: string,
): Promise<void> {
  const canvas = await captureElementToCanvas(element)
  canvasToLandscapePdf(canvas, filenameBase)
}
