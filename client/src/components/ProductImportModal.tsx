import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { Drawer } from './Drawer'
import { CATEGORY_LABEL, PRODUCTS } from '@/data/catalog'
import { bulkImportProducts, type BulkProductInput } from '@/data/actions'
import { downloadExcelTemplate, parseExcelFile, type ExcelProductRow } from '@/lib/excel'

interface ProductImportModalProps {
  open: boolean
  onClose: () => void
  location?: 'bar' | 'cuisine'
}

export function ProductImportModal({ open, onClose, location }: ProductImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ExcelProductRow[]>([])
  const [successInfo, setSuccessInfo] = useState<{ count: number; created: number; updated: number } | null>(null)
  const [forcedLocation, setForcedLocation] = useState<'auto' | 'bar' | 'cuisine'>(location || 'auto')

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
      const rows = await parseExcelFile(selected, location)
      if (rows.length === 0) {
        setError('Aucun produit valide trouvé dans ce fichier Excel.')
      } else {
        setParsedRows(rows)
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la lecture du fichier Excel.')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirmImport() {
    if (parsedRows.length === 0) return

    const items: BulkProductInput[] = parsedRows.map((r) => ({
      name: r.name,
      location: forcedLocation === 'auto' ? r.location : forcedLocation,
      categoryId: r.categoryId,
      storageUnit: r.storageUnit,
      saleUnit: r.saleUnit,
      price: r.price,
      costPrice: r.costPrice,
      initialStock: r.initialStock,
      minStock: r.minStock,
      targetStock: r.targetStock,
    }))

    const res = bulkImportProducts(items, 'Import Excel')
    if (!res.ok) {
      setError(res.error || 'Erreur lors de l\'enregistrement des produits.')
      return
    }

    setSuccessInfo({ count: res.count, created: res.created, updated: res.updated })
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Importer des produits (Excel)"
      subtitle="Import en masse de votre catalogue et configuration initiale des stocks via un fichier .xlsx ou .xls"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={handleClose}>
            {successInfo ? 'Fermer' : 'Annuler'}
          </button>
          {!successInfo && (
            <button
              className="btn-primary btn-sm"
              disabled={parsedRows.length === 0 || loading}
              onClick={handleConfirmImport}
            >
              <Upload size={14} />
              Confirmer l'import ({parsedRows.length})
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* En-tête avec téléchargement du modèle */}
        <div className="flex items-center justify-between p-3.5 bg-ink-50 dark:bg-ink-800/40 rounded-xl border border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="text-copper shrink-0" size={20} />
            <div>
              <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">Modèle Excel prêt à l'emploi</div>
              <div className="text-[11.5px] text-ink-500 dark:text-ink-400">Colonnes préconfigurées : Nom, Service, Catégorie, Unité, Prix, Stock...</div>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary btn-xs shrink-0"
            onClick={() => downloadExcelTemplate(location)}
          >
            <Download size={13} />
            Télécharger le modèle
          </button>
        </div>

        {/* Zone de téléversement */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-200 dark:border-ink-700 hover:border-copper dark:hover:border-copper/70 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/50 dark:bg-ink-900/30"
            >
              <div className="w-12 h-12 rounded-full bg-copper/10 text-copper flex items-center justify-center mx-auto mb-3">
                <Upload size={22} />
              </div>
              <div className="text-[13.5px] font-medium text-ink-900 dark:text-ink-100">
                Cliquez pour choisir votre fichier Excel (.xlsx, .xls)
              </div>
              <p className="text-[12px] text-ink-500 dark:text-ink-400 mt-1 max-w-sm mx-auto">
                Glissez votre document ou parcourez vos dossiers locaux.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{file.name}</div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400">
                    {(file.size / 1024).toFixed(1)} Ko · {parsedRows.length} produit(s) détecté(s)
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-500"
                onClick={resetState}
                title="Changer de fichier"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-ink-500">
            <Loader2 size={16} className="animate-spin text-copper" />
            Analyse du fichier Excel en cours…
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-[12.5px]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Message de succès */}
        {successInfo && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium text-[13.5px]">
              <CheckCircle2 size={18} />
              Importation réussie avec succès !
            </div>
            <p className="text-[12.5px] text-emerald-800 dark:text-emerald-200">
              {successInfo.created > 0 && `${successInfo.created} nouveau(x) produit(s) créé(s). `}
              {successInfo.updated > 0 && `${successInfo.updated} produit(s) mis à jour (stocks / prix). `}
              Le catalogue et l'état des stocks ont été automatiquement mis à jour.
            </p>
          </div>
        )}

        {/* Tableau de prévisualisation des lignes parsées */}
        {parsedRows.length > 0 && !successInfo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[12.5px] font-medium text-ink-800 dark:text-ink-200">
                Aperçu des données ({parsedRows.length} lignes)
              </div>
              {!location && (
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-ink-500">Service cible :</span>
                  <select
                    className="input !py-1 !text-xs !w-auto"
                    value={forcedLocation}
                    onChange={(e) => setForcedLocation(e.target.value as any)}
                  >
                    <option value="auto">Détecté par ligne</option>
                    <option value="bar">Forcer Bar</option>
                    <option value="cuisine">Forcer Cuisine</option>
                  </select>
                </div>
              )}
            </div>

            <div className="max-h-[280px] overflow-y-auto border border-ink-100 dark:border-ink-800 rounded-xl">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-ink-50 dark:bg-ink-800/80 sticky top-0 text-ink-600 dark:text-ink-400 font-medium">
                  <tr>
                    <th className="py-2 px-3">Produit</th>
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">Catégorie</th>
                    <th className="py-2 px-3 text-right">Stock initial</th>
                    <th className="py-2 px-3 text-right">Seuil / Cible</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {parsedRows.map((r, i) => {
                    const isExisting = PRODUCTS.some((p) => p.name.toLowerCase() === r.name.toLowerCase())
                    return (
                      <tr key={i} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/30">
                        <td className="py-2 px-3 font-medium text-ink-900 dark:text-ink-100">
                          {r.name}
                        </td>
                        <td className="py-2 px-3 capitalize">
                          {forcedLocation === 'auto' ? r.location : forcedLocation}
                        </td>
                        <td className="py-2 px-3 text-ink-500">
                          {CATEGORY_LABEL[r.categoryId] || r.categoryId}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {r.initialStock} {r.storageUnit}
                        </td>
                        <td className="py-2 px-3 text-right text-ink-500">
                          {r.minStock} / {r.targetStock}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-medium ${
                              isExisting
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            }`}
                          >
                            {isExisting ? 'Mise à jour' : 'Nouveau'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
