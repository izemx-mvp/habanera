// Génération de PDF — bons de prélèvement et bons de commande, à partir des données réellement
// enregistrées (aucun fichier vide, aucun lien fictif).
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BRAND } from '@/data/brand'
import { productById } from '@/data/catalog'
import { LOCATION_LABEL, PO_STATUS_LABEL, REQ_STATUS_LABEL, fmtDate, fmtMAD, supplierName, userName } from '@/data/selectors'
import type { PurchaseOrder, RequisitionOrder } from '@/data/types'

function header(doc: jsPDF, type: string, ref: string, date: string, status: string) {
  doc.setFillColor(26, 16, 10)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(BRAND.name, 14, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(BRAND.tagline, 14, 19)
  doc.setFontSize(12)
  doc.text(type, 196, 13, { align: 'right' })
  doc.setFontSize(9)
  doc.text(`Réf. ${ref}`, 196, 19, { align: 'right' })

  doc.setTextColor(36, 26, 20)
  doc.setFontSize(10)
  doc.text(`Date : ${fmtDate(date)}`, 14, 37)
  doc.text(`Statut : ${status}`, 14, 43)
}

function footer(doc: jsPDF) {
  const page = doc.getNumberOfPages()
  for (let i = 1; i <= page; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(120, 107, 96)
    doc.text('MVP conçu et développé par IZEMX · Document généré depuis les données enregistrées de la démonstration HABANERA.', 105, 290, { align: 'center' })
  }
}

export function requisitionPDF(r: RequisitionOrder): jsPDF {
  const doc = new jsPDF()
  header(doc, 'Bon de prélèvement', r.id, r.date, REQ_STATUS_LABEL[r.status])
  doc.setFontSize(10)
  doc.text(`Service demandeur : ${LOCATION_LABEL[r.requestingLocation]}`, 14, 51)
  doc.text(`Demandé par : ${userName(r.requestedBy)}`, 14, 57)
  if (r.comment) doc.text(`Commentaire : ${r.comment}`, 14, 63)

  autoTable(doc, {
    startY: r.comment ? 70 : 64,
    head: [['Produit', 'Unité', 'Qté demandée', 'Qté préparée', 'Qté livrée']],
    body: r.items.map((it) => {
      const p = productById(it.productId)
      return [p?.name ?? it.productId, it.unit, it.qtyRequested, it.qtyPrepared, it.qtyDelivered]
    }),
    headStyles: { fillColor: [183, 121, 75] },
    styles: { fontSize: 9 },
  })

  const y = ((doc as any).lastAutoTable?.finalY ?? 100) + 10
  doc.setFontSize(9)
  doc.text('Historique :', 14, y)
  r.history.forEach((h, i) => {
    doc.text(`• ${fmtDate(h.date)} — ${REQ_STATUS_LABEL[h.status]} (${userName(h.userId)})${h.comment ? ' — ' + h.comment : ''}`, 14, y + 6 + i * 6)
  })

  footer(doc)
  return doc
}

export function purchaseOrderPDF(po: PurchaseOrder): jsPDF {
  const doc = new jsPDF()
  header(doc, 'Bon de commande', po.id, po.date, PO_STATUS_LABEL[po.status])
  doc.setFontSize(10)
  doc.text(`Fournisseur : ${supplierName(po.supplierId)}`, 14, 51)
  doc.text(`Créée par : ${userName(po.createdBy)}`, 14, 57)

  autoTable(doc, {
    startY: 64,
    head: [['Produit', 'Qté commandée', 'Qté reçue', 'Coût unitaire', 'Valeur']],
    body: po.items.map((it) => {
      const p = productById(it.productId)
      return [p?.name ?? it.productId, it.qtyOrdered, it.qtyReceived, fmtMAD(it.unitCost), it.unitCost != null ? fmtMAD(it.unitCost * it.qtyOrdered) : 'Non renseigné']
    }),
    headStyles: { fillColor: [183, 121, 75] },
    styles: { fontSize: 9 },
  })

  footer(doc)
  return doc
}

// L'aperçu et l'impression passent par <PdfPreviewModal> (iframe intégré à l'application) :
// fiable quel que soit le bloqueur de pop-up du navigateur, contrairement à window.open().
export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename)
}
