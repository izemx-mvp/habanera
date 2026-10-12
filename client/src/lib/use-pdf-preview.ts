import { useState } from 'react'
import type { jsPDF } from 'jspdf'

export function usePdfPreview() {
  const [doc, setDoc] = useState<jsPDF | null>(null)
  const [filename, setFilename] = useState('document.pdf')

  function open(buildDoc: () => jsPDF, name: string) {
    setDoc(buildDoc())
    setFilename(name)
  }
  function close() {
    setDoc(null)
  }

  return { doc, filename, open, close }
}
