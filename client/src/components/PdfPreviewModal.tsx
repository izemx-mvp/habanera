import { useEffect, useMemo, useRef } from 'react'
import { FileDown, Printer, X } from 'lucide-react'
import type { jsPDF } from 'jspdf'

export function PdfPreviewModal({ doc, filename, onClose }: { doc: jsPDF | null; filename: string; onClose: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const url = useMemo(() => (doc ? (doc.output('bloburl') as unknown as string) : null), [doc])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!doc || !url) return null

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/60 animate-fadeUp">
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800">
        <div className="text-[13.5px] font-medium text-ink-900 dark:text-ink-50 truncate">{filename}</div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost btn-sm" onClick={() => doc.save(filename)}>
            <FileDown size={14} />
            Télécharger
          </button>
          <button className="btn-ghost btn-sm" onClick={() => iframeRef.current?.contentWindow?.print()}>
            <Printer size={14} />
            Imprimer
          </button>
          <button className="p-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800" onClick={onClose} aria-label="Fermer l'aperçu">
            <X size={18} className="dark:text-ink-200" />
          </button>
        </div>
      </div>
      <iframe ref={iframeRef} src={url} title={filename} className="flex-1 w-full bg-ink-200" />
    </div>
  )
}
