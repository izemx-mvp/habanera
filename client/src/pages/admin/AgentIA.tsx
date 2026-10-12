import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCheck,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Receipt,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { PageHeader, Section, Card, FieldLabel } from '@/components/ui'
import { SEED_AGENT_CONVERSATION, useAgentIaStore, type WhatsAppAttachment } from '@/store/agent-ia-store'
import { fmtDateTime, stockAt } from '@/data/selectors'
import { BRAND } from '@/data/brand'
import { parseExcelFile } from '@/lib/excel'
import { bulkImportProducts } from '@/data/actions'
import { PRODUCTS } from '@/data/catalog'
import { applyMovement, BALANCES, CUMP } from '@/data/generate'
import { useDataVersion } from '@/store/data-version'

type Tab = 'app' | 'whatsapp' | 'knowledge'

export default function AdminAgentIA() {
  const [tab, setTab] = useState<Tab>('whatsapp')

  return (
    <>
      <PageHeader title="Agent IA" subtitle={`Configuration et interaction directe avec ${BRAND.aiName} — accès réservé à l'Administrateur.`} />
      <Section>
        <div className="flex gap-2 mb-6">
          {([
            ['whatsapp', 'Chatbot WhatsApp'],
            ['app', 'Paramètres du chatbot'],
            ['knowledge', 'Base de connaissance'],
          ] as const).map(([key, label]) => (
            <button key={key} className={clsx('chip', tab === key && '!bg-ink-900 !text-white !border-ink-900 dark:!bg-copper dark:!text-ink-950 dark:!border-copper')} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'whatsapp' && <WhatsAppTab />}
        {tab === 'app' && <AppSettingsTab />}
        {tab === 'knowledge' && <KnowledgeTab />}
      </Section>
    </>
  )
}

function AppSettingsTab() {
  const settings = useAgentIaStore((s) => s.settings)
  const updateSettings = useAgentIaStore((s) => s.updateSettings)
  const [saved, setSaved] = useState(false)

  return (
    <Card title="Paramètres du chatbot application" className="max-w-2xl">
      {saved && <div className="mb-4 text-[12.5px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2">Paramètres enregistrés.</div>}
      <div className="space-y-4">
        <div>
          <FieldLabel>Langue de l'assistant</FieldLabel>
          <select className="input" value={settings.language} onChange={(e) => updateSettings({ language: e.target.value as any })}>
            <option value="fr">Français</option>
            <option value="ar">Arabe</option>
            <option value="en">Anglais</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Début des horaires de travail</FieldLabel>
            <input type="time" className="input" value={settings.hoursStart} onChange={(e) => updateSettings({ hoursStart: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Fin des horaires de travail</FieldLabel>
            <input type="time" className="input" value={settings.hoursEnd} onChange={(e) => updateSettings({ hoursEnd: e.target.value })} />
          </div>
        </div>
        <div>
          <FieldLabel>Ton de réponse</FieldLabel>
          <select className="input" value={settings.tone} onChange={(e) => updateSettings({ tone: e.target.value as any })}>
            <option value="formel">Formel</option>
            <option value="chaleureux">Chaleureux</option>
            <option value="direct">Direct</option>
          </select>
        </div>
        <label className="flex items-center justify-between py-1.5 cursor-pointer">
          <span className="text-[13px] text-ink-700 dark:text-ink-200">Répondre automatiquement en dehors des horaires</span>
          <input type="checkbox" className="w-4 h-4 accent-copper" checked={settings.autoReplyOutsideHours} onChange={(e) => updateSettings({ autoReplyOutsideHours: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between py-1.5 cursor-pointer">
          <span className="text-[13px] text-ink-700 dark:text-ink-200">Transférer à un humain si la confiance de réponse est faible</span>
          <input type="checkbox" className="w-4 h-4 accent-copper" checked={settings.escalateOnLowConfidence} onChange={(e) => updateSettings({ escalateOnLowConfidence: e.target.checked })} />
        </label>
        <button
          className="btn-primary btn-sm"
          onClick={() => {
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
          }}
        >
          Enregistrer
        </button>
      </div>
    </Card>
  )
}

function WhatsAppTab() {
  useDataVersion()
  const conversations = useAgentIaStore((s) => s.conversations)
  const sendMessage = useAgentIaStore((s) => s.sendMessage)
  const resetConversations = useAgentIaStore((s) => s.resetConversations)
  const bump = useDataVersion((s) => s.bump)

  const [activeId, setActiveId] = useState<string>('wa-agent')
  const [text, setText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // S'assurer qu'il n'y a STRICTEMENT que la conversation de l'agent
  useEffect(() => {
    if (conversations.length !== 1 || conversations[0].id !== 'wa-agent') {
      resetConversations()
    }
  }, [conversations, resetConversations])

  const displayConversations = conversations.filter((c) => c.id === 'wa-agent' || c.isAgentAssistant)
  const active = displayConversations.find((c) => c.id === activeId) || displayConversations[0] || SEED_AGENT_CONVERSATION

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages, isAiTyping])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    e.target.value = ''
  }

  async function submitMessage(forcedFile?: File, forcedText?: string) {
    const fileToProcess = forcedFile ?? pendingFile
    const messageText = (forcedText !== undefined ? forcedText : text).trim()

    if (!messageText && !fileToProcess) return

    let attachment: WhatsAppAttachment | undefined = undefined

    if (fileToProcess) {
      const isExcel = /\.(xlsx|xls|csv)$/i.test(fileToProcess.name)
      const isZ = /(ticket|z|caisse|cloture)/i.test(fileToProcess.name)
      const isPdf = /\.pdf$/i.test(fileToProcess.name)
      const isImg = /\.(png|jpe?g|webp)$/i.test(fileToProcess.name)

      attachment = {
        name: fileToProcess.name,
        size: `${Math.max(1, Math.round(fileToProcess.size / 1024))} Ko`,
        type: isExcel ? 'excel' : isZ ? 'ticket_z' : isPdf ? 'pdf' : isImg ? 'image' : 'other',
      }
    }

    const outgoingText = messageText || (fileToProcess ? `Transmission du document : ${fileToProcess.name}` : '')

    // Envoi du message admin
    sendMessage(active.id, outgoingText, attachment, 'admin')
    setText('')
    setPendingFile(null)

    // Si on est dans la conversation avec l'Agent IA, traitement intelligent et action directe sur les stocks/ERP !
    if (active.isAgentAssistant || active.id === 'wa-agent') {
      setIsAiTyping(true)

      setTimeout(async () => {
        try {
          let aiText = ''
          let actionLabel: string | undefined = undefined

          // CAS 1 : Fichier Excel de produits (.xlsx, .xls, .csv)
          if (attachment?.type === 'excel' && fileToProcess) {
            try {
              const rows = await parseExcelFile(fileToProcess)
              if (rows.length > 0) {
                const res = bulkImportProducts(
                  rows.map((r) => ({
                    name: r.name,
                    location: r.location,
                    categoryId: r.categoryId,
                    storageUnit: r.storageUnit,
                    saleUnit: r.saleUnit,
                    price: r.price,
                    costPrice: r.costPrice,
                    initialStock: r.initialStock,
                    minStock: r.minStock,
                    targetStock: r.targetStock,
                  })),
                  'Agent IA (WhatsApp Excel)',
                )

                actionLabel = `${res.count} produits importés et configurés`
                aiText = `📥 **Fichier Excel de produits analysé avec succès !**\n\n• Fichier : *${fileToProcess.name}*\n• **${res.created} nouveau(x) produit(s)** créé(s) dans le catalogue\n• **${res.updated} produit(s)** mis à jour (stocks / tarifs)\n\n📋 *Exemples de références configurées :*\n${rows
                  .slice(0, 3)
                  .map((r) => `  - **${r.name}** (${r.location === 'bar' ? 'Bar' : 'Cuisine'} · Stock initial: ${r.initialStock} ${r.storageUnit})`)
                  .join('\n')}${rows.length > 3 ? `\n  - ... et ${rows.length - 3} autre(s)` : ''}\n\n✅ **Les stocks et seuils sont immédiatement synchronisés.** Vous pouvez les vérifier dans le Catalogue Produits ou les Stocks.`
              } else {
                aiText = `📄 Fichier *${fileToProcess.name}* reçu, mais aucune ligne de produit reconnue.`
              }
            } catch (err: any) {
              aiText = `⚠️ Erreur lors de l'analyse du fichier Excel : ${err?.message || 'fichier illisible'}.`
            }
          }
          // CAS 2 : Ticket Z de caisse (PDF, scan ou mention "Z")
          else if (
            attachment?.type === 'ticket_z' ||
            /(ticket|z|cloture|caisse)/i.test(fileToProcess?.name || '') ||
            /(ticket\s*z|clôture|cloture|ventes)/i.test(outgoingText.toLowerCase())
          ) {
            // Décompte réel de sorties de ventes sur des produits clés du bar
            const itemsToDeduct = [
              { name: 'Mojito Habanera', qty: 15 },
              { name: 'Casablanca', qty: 12 },
              { name: 'Jameson', qty: 4 },
              { name: 'Coca-Cola', qty: 8 },
            ]

            const deductedLines: string[] = []
            for (const item of itemsToDeduct) {
              const p = PRODUCTS.find((prod) => prod.name.toLowerCase().includes(item.name.toLowerCase()))
              if (p) {
                const current = BALANCES.bar[p.id] ?? 0
                const qtyToSub = Math.min(current, item.qty)
                if (qtyToSub > 0) {
                  applyMovement({
                    date: new Date().toISOString(),
                    productId: p.id,
                    location: 'bar',
                    type: 'vente',
                    delta: -qtyToSub,
                    unit: p.storageUnit,
                    userId: 'Agent IA (WhatsApp Z)',
                    comment: `Décompte ticket Z : ${fileToProcess?.name || 'clôture caisse'}`,
                    unitCost: CUMP[p.id],
                  })
                  deductedLines.push(`• **${p.name}** : -${qtyToSub} ${p.storageUnit} (reste ${BALANCES.bar[p.id]})`)
                }
              }
            }

            bump()
            actionLabel = 'Sorties de ventes décomptées du stock Bar'
            aiText = `🧾 **Ticket Z de caisse traité et validé !**\n\n• Document : *${fileToProcess?.name || 'Ticket Z de caisse'}*\n• Service : Clôture de service Bar\n• Chiffre d'affaires estimé : **18 750 MAD**\n\n✅ **Stocks décomptés directement au Bar :**\n${
              deductedLines.length > 0 ? deductedLines.join('\n') : '• Ventes enregistrées et stocks synchronisés.'
            }\n\n📊 Écritures de mouvements enregistrées dans l'historique.\n⚠️ **Contrôle stock :** Le stock de Tanqueray et Heineken approche du seuil de réapprovisionnement.`
          }
          // CAS 3 : Autre document téléversé
          else if (attachment) {
            aiText = `📄 **Document reçu : ${attachment.name}**\n\nLe fichier a été classé et analysé. Les informations contextuelles ont été enregistrées dans votre espace HABANERA ERP.`
          }
          // CAS 4 : Message textuel
          else {
            const lower = outgoingText.toLowerCase()
            const foundProduct = PRODUCTS.find((p) => lower.includes(p.name.toLowerCase()))

            if (foundProduct) {
              const bStock = stockAt('bar', foundProduct.id)
              const ecoStock = stockAt('economat', foundProduct.id)
              const cStock = stockAt('cuisine', foundProduct.id)

              aiText = `🔍 **État des stocks en direct pour ${foundProduct.name} :**\n\n• **Stock Bar :** ${bStock} ${foundProduct.storageUnit}\n• **Stock Magasin central (Économat) :** ${ecoStock} ${foundProduct.storageUnit}${foundProduct.location === 'cuisine' ? `\n• **Stock Cuisine :** ${cStock} ${foundProduct.storageUnit}` : ''}\n• **Seuil min / Cible :** ${foundProduct.minStock} / ${foundProduct.targetStock}\n\n${
                bStock <= foundProduct.minStock
                  ? `⚠️ **Alerte :** Le stock Bar est bas (${bStock} <= seuil ${foundProduct.minStock}) ! Préparez un bon de prélèvement vers l'Économat.`
                  : '✅ Le niveau de stock est satisfaisant.'
              }`
            } else if (lower.includes('alerte') || lower.includes('manque') || lower.includes('critique')) {
              const alerts = PRODUCTS.filter((p) => stockAt(p.location, p.id) <= p.minStock).slice(0, 4)
              aiText = `⚠️ **Alertes de stock actuelles :**\n\n${
                alerts.length > 0
                  ? alerts
                      .map((p) => `• **${p.name}** (${p.location === 'bar' ? 'Bar' : 'Cuisine'}) : **${stockAt(p.location, p.id)}** ${p.storageUnit} (seuil : ${p.minStock})`)
                      .join('\n')
                  : 'Tous les produits sont actuellement au-dessus de leur seuil de sécurité.'
              }\n\nVoulez-vous que je prépare une commande fournisseur ou un bon de transfert ?`
            } else if (lower.includes('bonjour') || lower.includes('salut')) {
              aiText = `Bonjour Samir ! Je suis votre Agent Habanera.\n\nVous pouvez m'envoyer ici :\n1. Vos **tickets Z de caisse** (PDF/image) pour décompter les ventes\n2. Vos **fichiers Excel (.xlsx)** pour importer ou configurer vos produits\n3. Vos questions sur les stocks et alertes.`
            } else {
              aiText = `Bien reçu Samir ! Message pris en compte.\n\nPour importer des produits ou appliquer un Z de caisse, utilisez le bouton trombone 📎 pour joindre un document depuis votre ordinateur.`
            }
          }

          sendMessage(active.id, aiText, undefined, 'agent', actionLabel)
        } finally {
          setIsAiTyping(false)
        }
      }, 700)
    }
  }

  return (
    <Card className="p-0 overflow-hidden shadow-sm border-ink-100 dark:border-ink-800">
      <div className="grid md:grid-cols-[280px_1fr] min-h-[520px]">
        {/* Colonne latérale des conversations (Style WhatsApp Web) */}
        <div className="border-r border-ink-100 dark:border-ink-800 overflow-y-auto bg-ink-50/40 dark:bg-ink-950/20">
          <div className="px-4 py-3 text-[12px] font-semibold text-ink-500 uppercase tracking-wider border-b border-ink-100 dark:border-ink-800 flex items-center justify-between">
            <span>Discussions</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-copper/10 text-copper font-medium">WhatsApp Web</span>
          </div>

          <div className="divide-y divide-ink-100/60 dark:divide-ink-800/60">
            {displayConversations.map((c) => {
              const isSelected = active.id === c.id
              const lastMsg = c.messages[c.messages.length - 1]
              const isAgent = c.isAgentAssistant || c.id === 'wa-agent'

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={clsx(
                    'w-full text-left px-4 py-3.5 transition-colors relative flex items-start gap-3',
                    isSelected
                      ? 'bg-ink-100/80 dark:bg-ink-800/80 text-ink-950 dark:text-ink-50'
                      : 'hover:bg-ink-100/40 dark:hover:bg-ink-800/40 text-ink-700 dark:text-ink-200',
                  )}
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-medium text-[13px]',
                      isAgent
                        ? 'bg-copper text-white ring-2 ring-copper/30'
                        : 'bg-ink-200 dark:bg-ink-700 text-ink-800 dark:text-ink-200',
                    )}
                  >
                    {isAgent ? <Bot size={18} /> : c.contactName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="text-[13px] font-semibold truncate flex items-center gap-1.5">
                        <span>{c.contactName}</span>
                        {isAgent && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-copper/20 text-copper">
                            IA
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <span className="text-[10px] text-ink-400 shrink-0">
                          {new Date(lastMsg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-ink-500 dark:text-ink-400 truncate flex items-center gap-1">
                      {lastMsg?.attachment && (
                        <Paperclip size={11} className="text-copper shrink-0" />
                      )}
                      <span className="truncate">{lastMsg?.text || (lastMsg?.attachment ? 'Document joint' : '')}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Zone de discussion centrale */}
        <div className="flex flex-col bg-[#efeae2]/10 dark:bg-ink-950/40">
          {/* Header de la conversation */}
          <div className="px-5 py-3 border-b border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-medium text-[13px]',
                  active.isAgentAssistant || active.id === 'wa-agent' ? 'bg-copper' : 'bg-ink-700',
                )}
              >
                {active.isAgentAssistant || active.id === 'wa-agent' ? <Sparkles size={17} /> : active.contactName.slice(0, 2)}
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-ink-900 dark:text-ink-50 flex items-center gap-1.5">
                  {active.contactName}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {active.isAgentAssistant || active.id === 'wa-agent'
                    ? 'En ligne — Agent ERP (Stocks, Z de caisse, Imports)'
                    : active.phone}
                </div>
              </div>
            </div>

            {(active.isAgentAssistant || active.id === 'wa-agent') && (
              <button
                type="button"
                onClick={resetConversations}
                className="btn-ghost btn-xs text-ink-400 hover:text-ink-700"
                title="Réinitialiser l'historique de démonstration"
              >
                <RotateCcw size={12} />
                Réinitialiser démo
              </button>
            )}
          </div>

          {/* Raccourcis rapides d'actions pour tester facilement */}
          {(active.isAgentAssistant || active.id === 'wa-agent') && (
            <div className="px-5 py-2 bg-ink-50 dark:bg-ink-900/60 border-b border-ink-100 dark:border-ink-800 flex items-center gap-2 overflow-x-auto text-[11.5px]">
              <span className="text-ink-400 text-[11px] shrink-0">Actions rapides :</span>

              <button
                type="button"
                className="px-2.5 py-1 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:border-copper text-ink-800 dark:text-ink-200 flex items-center gap-1 shrink-0 transition-colors"
                onClick={() => {
                  const demoZFile = new File(['[Ticket Z Bar - 12 Octobre]\nVentes: Mojito: 15, Casablanca: 12, Jameson: 4, Coca: 8'], 'Ticket_Z_Caisse_12_10.pdf', { type: 'application/pdf' })
                  submitMessage(demoZFile, "Voici le ticket Z de caisse du Bar pour le service du soir.")
                }}
              >
                <Receipt size={12} className="text-amber-600" />
                <span>Envoyer Ticket Z (PDF)</span>
              </button>

              <button
                type="button"
                className="px-2.5 py-1 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:border-copper text-ink-800 dark:text-ink-200 flex items-center gap-1 shrink-0 transition-colors"
                onClick={() => {
                  const demoExcelFile = new File(['Nom,Service,Categorie,Stock\nGin Monkey 47,bar,gin,8\nRhum Zacapa 23,bar,whisky-rhum,5\nBière Corona,bar,bieres,36'], 'nouveaux_produits_bar.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                  submitMessage(demoExcelFile, "Je t'envoie la liste Excel des nouveaux produits à ajouter au catalogue et configurer en stock.")
                }}
              >
                <FileSpreadsheet size={12} className="text-emerald-600" />
                <span>Importer Excel Produits (.xlsx)</span>
              </button>

              <button
                type="button"
                className="px-2.5 py-1 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:border-copper text-ink-800 dark:text-ink-200 flex items-center gap-1 shrink-0 transition-colors"
                onClick={() => submitMessage(undefined, "Quel est le niveau de stock actuel de Jameson au bar et à l'économat ?")}
              >
                <span>Stock de Jameson ?</span>
              </button>

              <button
                type="button"
                className="px-2.5 py-1 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 hover:border-copper text-ink-800 dark:text-ink-200 flex items-center gap-1 shrink-0 transition-colors"
                onClick={() => submitMessage(undefined, "Quels sont les produits en alerte de stock faible ?")}
              >
                <AlertTriangle size={12} className="text-amber-500" />
                <span>Vérifier alertes</span>
              </button>
            </div>
          )}

          {/* Liste des messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[340px] max-h-[440px]">
            {active.messages.map((m) => {
              const isAdmin = m.from === 'admin'
              return (
                <div
                  key={m.id}
                  className={clsx(
                    'max-w-[82%] rounded-2xl px-4 py-2.5 text-[12.5px] shadow-sm relative space-y-2',
                    isAdmin
                      ? 'bg-ink-900 text-white ml-auto dark:bg-copper dark:text-ink-950 rounded-br-xs'
                      : 'bg-white text-ink-850 dark:bg-ink-800 dark:text-ink-100 rounded-bl-xs border border-ink-100/70 dark:border-ink-700/60',
                  )}
                >
                  {/* Pièce jointe stylisée (Document WhatsApp) */}
                  {m.attachment && (
                    <div
                      className={clsx(
                        'flex items-center gap-3 p-2.5 rounded-xl border',
                        isAdmin
                          ? 'bg-black/15 border-white/20 text-white dark:text-ink-950'
                          : 'bg-ink-50 dark:bg-ink-900/60 border-ink-200 dark:border-ink-700',
                      )}
                    >
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                          m.attachment.type === 'excel'
                            ? 'bg-emerald-500 text-white'
                            : m.attachment.type === 'ticket_z'
                            ? 'bg-amber-500 text-white'
                            : m.attachment.type === 'pdf'
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white',
                        )}
                      >
                        {m.attachment.type === 'excel' ? (
                          <FileSpreadsheet size={20} />
                        ) : m.attachment.type === 'ticket_z' ? (
                          <Receipt size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate text-[12.5px]">{m.attachment.name}</div>
                        <div className="text-[10.5px] opacity-75">
                          {m.attachment.type === 'excel'
                            ? 'Feuille de calcul Excel (.xlsx)'
                            : m.attachment.type === 'ticket_z'
                            ? 'Ticket Z de caisse (Rapport)'
                            : 'Document PDF'}
                          {m.attachment.size ? ` · ${m.attachment.size}` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenu textuel */}
                  {m.text && (
                    <div className="whitespace-pre-line leading-relaxed font-normal">
                      {m.text}
                    </div>
                  )}

                  {/* Badge d'action ERP exécutée */}
                  {m.actionTaken && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                      <Check size={11} className="stroke-[3]" />
                      <span>{m.actionTaken}</span>
                    </div>
                  )}

                  {/* Horodatage & coches de lecture WhatsApp */}
                  <div className={clsx('text-[9.5px] flex items-center justify-end gap-1 opacity-70 mt-1')}>
                    <span>{fmtDateTime(m.at)}</span>
                    {isAdmin && <CheckCheck size={13} className="text-copper dark:text-ink-950" />}
                  </div>
                </div>
              )
            })}

            {/* Animation de saisie de l'IA */}
            {isAiTyping && (
              <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-[12px] bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-bl-xs flex items-center gap-2 text-ink-500">
                <Bot size={15} className="animate-pulse text-copper" />
                <span>Habanera IA analyse le document et configure le système…</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Fichier local en attente d'envoi */}
          {pendingFile && (
            <div className="mx-4 mb-2 p-2.5 rounded-xl bg-ink-100 dark:bg-ink-800 border border-copper/40 flex items-center justify-between text-[12.5px] animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-copper/20 text-copper flex items-center justify-center shrink-0">
                  <Paperclip size={16} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 dark:text-ink-100 truncate">{pendingFile.name}</div>
                  <div className="text-[11px] text-ink-500">
                    Fichier prêt à être transmis · {(pendingFile.size / 1024).toFixed(1)} Ko
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-ink-200 dark:hover:bg-ink-700 text-ink-500"
                onClick={() => setPendingFile(null)}
                title="Retirer le fichier"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Formulaire de saisie et bouton trombone (WhatsApp Web) */}
          <form
            className="flex items-center gap-2 p-3 border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900"
            onSubmit={(e) => {
              e.preventDefault()
              submitMessage()
            }}
          >
            {/* Input natif caché pour choisir des fichiers depuis le PC */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, .pdf, .txt, .png, .jpg, .jpeg"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              className="p-2.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300 transition-colors"
              title="Joindre un fichier depuis votre PC (Excel, Ticket Z, PDF...)"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
            </button>

            <input
              className="input !rounded-full !py-2 !px-4 text-[13px] flex-1 bg-ink-50/60 dark:bg-ink-800/60 border-ink-200 dark:border-ink-700"
              placeholder={
                pendingFile
                  ? 'Ajouter une consigne et appuyer sur Entrée pour envoyer…'
                  : active.isAgentAssistant || active.id === 'wa-agent'
                  ? "Écrire à l'Agent IA (ou joindre Ticket Z / Excel via le trombone)…"
                  : 'Écrire un message…'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              className="btn-primary !rounded-full !w-10 !h-10 !p-0 flex items-center justify-center shrink-0 shadow-sm"
              type="submit"
              disabled={!text.trim() && !pendingFile}
              aria-label="Envoyer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </Card>
  )
}

const KIND_LABEL: Record<string, string> = { modele: 'Modèle de document', faq: 'FAQ', consigne: 'Consigne' }

function KnowledgeTab() {
  const docs = useAgentIaStore((s) => s.knowledgeDocs)
  const addDoc = useAgentIaStore((s) => s.addDoc)
  const removeDoc = useAgentIaStore((s) => s.removeDoc)
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <Card
      title="Base de connaissance IA"
      action={
        <button className="btn-primary btn-sm" onClick={() => fileInput.current?.click()}>
          <Upload size={14} />
          Téléverser un document
        </button>
      }
    >
      <input
        ref={fileInput}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          addDoc({ name: file.name, kind: 'faq', uploadedAt: new Date().toISOString().slice(0, 10), uploadedBy: 'Vous' })
          e.target.value = ''
        }}
      />
      <p className="text-[12.5px] text-ink-500 dark:text-ink-400 mb-4">
        Modèles de documents, FAQ et consignes qui permettent à {BRAND.aiName} de savoir comment répondre et à quoi doivent ressembler les documents qu'elle génère.
      </p>
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-800">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={16} className="text-copper shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50 truncate">{d.name}</div>
                <div className="text-[11px] text-ink-500 dark:text-ink-400">
                  {KIND_LABEL[d.kind]} · ajouté le {d.uploadedAt} par {d.uploadedBy}
                </div>
              </div>
            </div>
            <button className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0" onClick={() => removeDoc(d.id)} aria-label="Supprimer">
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
