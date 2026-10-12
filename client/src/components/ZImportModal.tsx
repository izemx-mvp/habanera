import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, Receipt } from 'lucide-react'
import { Drawer } from './Drawer'
import { PRODUCTS } from '@/data/catalog'
import { bulkImportZSales } from '@/data/actions'
import { downloadZTemplate, parseZExcelFile, type ExcelZRow } from '@/lib/excel'
import { fmtMAD } from '@/data/selectors'
import type { StockLocationId } from '@/data/types'

interface ZImportModalProps {
  open: boolean
  onClose: () => void
  location?: StockLocationId
}

export function ZImportModal({ open, onClose, location = 'bar' }: ZImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ExcelZRow[]>([])
  const [successInfo, setSuccessInfo] = useState<{ count: number; zRef: string } | null>(null)
  const [zDate, setZDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [targetLocation, setTargetLocation] = useState<StockLocationId>(location)

  function resetState() {
    setFile(null)
    setParsedRows([])
    setError(null)
    setSuccessInfo(null)
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    resetState()
    onClose()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setError(null)
    setSuccessInfo(null)
    setFile(selected)
    setLoading(true)

    try {
      const rows = await parseZExcelFile(selected)
      if (rows.length === 0) {
        setError('Aucune ligne de vente valide trouvée dans ce document Ticket Z.')
      } else {
        setParsedRows(rows)
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la lecture du fichier Ticket Z.')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirmImport() {
    if (parsedRows.length === 0) return

    const zRef = `Z-${zDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`

    const items = parsedRows.map((r) => ({
      productName: r.productName,
      quantitySold: r.quantitySold,
      unitType: r.unitType,
      unitPrice: r.unitPrice,
      totalRevenue: r.totalRevenue,
    }))

    const res = bulkImportZSales(items, {
      location: targetLocation,
      zReference: zRef,
      date: `${zDate}T23:59:00.000Z`,
      userId: 'u-admin-1',
    })

    if (!res.ok) {
      setError(res.error || "Erreur lors de l'enregistrement des ventes du Ticket Z.")
      return
    }

    setSuccessInfo({
      count: res.processedCount,
      zRef,
    })
  }

  const totalCalculatedRevenue = parsedRows.reduce((sum, r) => sum + (r.totalRevenue ?? 0), 0)
  const totalItemsCount = parsedRows.reduce((sum, r) => sum + r.quantitySold, 0)

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Importer un Ticket Z (Clôture de Caisse)"
      subtitle="Importez le fichier Excel de la journée pour déduire automatiquement les ventes et doses du stock."
      width={620}
      actions={
        <>
          <button className="btn-secondary btn-sm" onClick={handleClose}>
            {successInfo ? 'Fermer' : 'Annuler'}
          </button>
          {!successInfo && (
            <button
              className="btn-primary btn-sm"
              disabled={parsedRows.length === 0 || loading}
              onClick={handleConfirmImport}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <Receipt size={14} />
                  Valider et déduire le stock ({parsedRows.length} lignes)
                </>
              )}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* BANNER TEMPLATE */}
        <div className="p-4 rounded-xl bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-copper" />
              Format Ticket Z (.xlsx / .xls)
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-400">
              Colonnes acceptées : <strong>Nom du produit</strong>, <strong>Quantité vendue</strong>, <strong>Unité/Format</strong> (verre, bouteille), <strong>Prix unitaire</strong>, <strong>Total Ventes</strong>.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-xs shrink-0 text-xs"
            onClick={() => downloadZTemplate()}
          >
            <Download size={13} />
            Télécharger modèle
          </button>
        </div>

        {/* DATE & SERVICE PARAMETERS */}
        {!successInfo && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5 block">Date de clôture Z</label>
              <input
                type="date"
                className="input input-sm w-full"
                value={zDate}
                onChange={(e) => setZDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Espace de déduction</label>
              <select
                className="input input-sm w-full"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value as StockLocationId)}
              >
                <option value="bar">Bar (boissons & doses)</option>
                <option value="cuisine">Cuisine</option>
              </select>
            </div>
          </div>
        )}

        {/* UPLOAD ZONE */}
        {!successInfo && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-300 dark:border-ink-700 hover:border-copper dark:hover:border-copper rounded-2xl p-8 text-center cursor-pointer transition bg-ink-50/50 dark:bg-ink-900/30 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-copper/10 text-copper flex items-center justify-center">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-ink-100">
                  {file ? file.name : 'Cliquez pour choisir le fichier du Ticket Z'}
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  Format Excel (.xlsx) généré par la caisse enregistreuse
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {successInfo && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 text-base">
                Ticket Z synchronisé avec succès !
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Référence : <strong>{successInfo.zRef}</strong> · {successInfo.count} article(s) déduit(s) du stock en temps réel.
              </p>
            </div>
            <button className="btn-primary btn-sm mx-auto" onClick={handleClose}>
              Terminer et voir les mouvements
            </button>
          </div>
        )}

        {/* PREVIEW TABLE */}
        {!successInfo && parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-900 dark:text-ink-100">
                Aperçu des ventes ({parsedRows.length} lignes · {totalItemsCount} portions/unités)
              </span>
              {totalCalculatedRevenue > 0 && (
                <span className="font-semibold text-copper">
                  Total Z : {fmtMAD(totalCalculatedRevenue)}
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto border border-ink-200 dark:border-ink-800 rounded-xl divide-y divide-ink-100 dark:divide-ink-800/60 text-xs">
              {parsedRows.map((r, i) => {
                const prod = PRODUCTS.find((p) => p.name.toLowerCase().includes(r.productName.toLowerCase()) || r.productName.toLowerCase().includes(p.name.toLowerCase()))
                return (
                  <div key={i} className="p-2.5 flex items-center justify-between hover:bg-ink-50 dark:hover:bg-ink-900/40">
                    <div className="min-w-0 pr-3">
                      <div className="font-medium text-ink-900 dark:text-ink-100 truncate">
                        {r.productName}
                      </div>
                      <div className="text-[11px] text-ink-500 flex items-center gap-2 mt-0.5">
                        <span className="capitalize">{r.unitType}</span>
                        {prod && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ {prod.name} (Catalogue)
                          </span>
                        )}
                        {!prod && (
                          <span className="text-amber-600 font-medium">
                            ⚠️ À rapprocher
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-red-600 dark:text-red-400">
                        -{r.quantitySold} {r.unitType}
                      </div>
                      {r.totalRevenue != null && (
                        <div className="text-[11px] text-ink-400">
                          {fmtMAD(r.totalRevenue)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
