import { useNavigate } from 'react-router-dom'
import { PageHeader, Section } from '@/components/ui'
import { DataTable } from '@/components/DataTable'
import { productById } from '@/data/catalog'
import { GOODS_RECEIPTS, PURCHASE_ORDERS } from '@/data/generate'
import { fmtDate, fmtMAD, supplierName, userName } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'

export default function AdminReceptions() {
  useDataVersion()
  const navigate = useNavigate()
  const rows = [...GOODS_RECEIPTS].sort((a, b) => b.date.localeCompare(a.date))
  const poById = (id: string) => PURCHASE_ORDERS.find((p) => p.id === id)

  return (
    <>
      <PageHeader title="Réceptions" subtitle="Chaque réception est rattachée à une commande fournisseur ; une commande peut être réceptionnée en plusieurs fois." />
      <Section>
        <DataTable
          rows={rows}
          onRowClick={() => navigate('/admin/commandes')}
          searchKeys={(r) => r.id}
          searchPlaceholder="Rechercher une réception…"
          columns={[
            { key: 'id', label: 'Référence', render: (r) => <span className="font-medium text-ink-900">{r.id}</span> },
            { key: 'po', label: 'Commande', render: (r) => r.purchaseOrderId },
            { key: 'supplier', label: 'Fournisseur', render: (r) => (poById(r.purchaseOrderId) ? supplierName(poById(r.purchaseOrderId)!.supplierId) : '—') },
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date), sortValue: (r) => r.date },
            { key: 'items', label: 'Lignes', render: (r) => r.items.map((i) => productById(i.productId)?.name).join(', ') },
            { key: 'qty', label: 'Quantité reçue', render: (r) => r.items.reduce((s, i) => s + i.qtyReceived, 0) },
            { key: 'value', label: 'Valeur', render: (r) => fmtMAD(r.items.reduce((s, i) => s + (i.unitCost != null ? i.unitCost * i.qtyReceived : 0), 0) || null) },
            { key: 'user', label: 'Reçu par', render: (r) => userName(r.receivedBy) },
          ]}
        />
      </Section>
    </>
  )
}
