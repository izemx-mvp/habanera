// Moteur déterministe de « Habanera AI » — aucune IA générative : les réponses sont calculées
// à partir des données simulées (stocks, mouvements, bons, sorties hors-vente). Refuse toute
// demande d'écriture (créer/modifier/supprimer) et propose une alternative en lecture.
import { productById } from '@/data/catalog'
import {
  acceptedOutflows,
  alertsFor,
  cumpOf,
  economatReplenishList,
  fmtDate,
  fmtMAD,
  hiddenStories,
  lossesValue,
  LOCATION_LABEL,
  openPurchaseOrders,
  OUTFLOW_REASON_LABEL,
  partialRequisitions,
  pendingOutflows,
  pendingRequisitions,
  preparingRequisitions,
  stockAt,
  supplierName,
} from '@/data/selectors'
import { PRODUCTS } from '@/data/catalog'
import { BRAND } from '@/data/brand'

export interface AiAnswer {
  text: string
  table?: { headers: string[]; rows: (string | number)[][] }
  agents: string[]
  sources: string[]
  actions?: { label: string; to: string }[]
  refusal?: boolean
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ')

const WRITE_PATTERNS = /\b(cree|creer|ajoute|ajouter|modifie|modifier|supprime|supprimer|valide|valider|rejette|rejeter|passe une commande|envoyer)\b/

function matchProduct(q: string) {
  return PRODUCTS.find((p) => q.includes(norm(p.name)))
}

export function ask(question: string): AiAnswer {
  const q = norm(question)

  if (WRITE_PATTERNS.test(q) && !/simul/.test(q)) {
    return {
      text: `${BRAND.aiName} ne peut pas exécuter d'action d'écriture depuis cette conversation. Ouvrez l'écran concerné (bon de prélèvement, sortie hors-vente, commande…) pour effectuer cette opération avec les contrôles et confirmations prévus.`,
      agents: [`${BRAND.aiName} · Garde-fou`],
      sources: [],
      refusal: true,
    }
  }

  const prod = matchProduct(q)
  if (prod) {
    const bar = stockAt('bar', prod.id)
    const cuisine = stockAt('cuisine', prod.id)
    const eco = stockAt('economat', prod.id)
    const cump = cumpOf(prod.id)
    return {
      text: `${prod.name} — stock Bar : ${bar} ${prod.storageUnit}(s), Cuisine : ${cuisine}, Économat : ${eco}. Seuil minimum : ${prod.minStock}, stock cible : ${prod.targetStock}. Coût moyen pondéré : ${cump != null ? fmtMAD(cump) : 'À valoriser (aucune réception connue)'}.`,
      agents: [`${BRAND.aiName} · Stocks`],
      sources: [`Catalogue produits`, `Mouvements de stock`],
      actions: [{ label: 'Voir la fiche produit', to: `/produits/${prod.id}` }],
    }
  }

  if (/seuil|critique|rupture|sous le minimum/.test(q)) {
    const alerts = [...alertsFor('bar'), ...alertsFor('cuisine')]
    if (!alerts.length) return { text: 'Aucun produit actif n\'est actuellement sous son seuil minimum.', agents: [`${BRAND.aiName} · Stocks`], sources: ['Alertes de stock'] }
    return {
      text: `${alerts.length} référence(s) sont sous leur seuil minimum : ${alerts.map((a) => `${productById(a.productId)!.name} (${LOCATION_LABEL[a.location]}, ${a.currentQty}/${a.minStock})`).join(', ')}.`,
      table: { headers: ['Produit', 'Service', 'Stock', 'Seuil'], rows: alerts.map((a) => [productById(a.productId)!.name, LOCATION_LABEL[a.location], a.currentQty, a.minStock]) },
      agents: [`${BRAND.aiName} · Stocks`],
      sources: ['Alertes de stock'],
      actions: [{ label: 'Voir les alertes', to: '/admin/alertes' }],
    }
  }

  if (/perte|pertes valid/.test(q)) {
    const total = lossesValue()
    const list = acceptedOutflows()
    return {
      text: `La valeur cumulée des sorties hors-vente acceptées est de ${fmtMAD(total)}, sur ${list.length} déclaration(s) validée(s). Les déclarations rejetées ne sont jamais comptabilisées.`,
      agents: [`${BRAND.aiName} · Pertes`],
      sources: ['Sorties hors-vente'],
      actions: [{ label: 'Voir les sorties hors-vente', to: '/admin/sorties-hors-vente' }],
    }
  }

  if (/sortie.*(attente|valider)|a valider|hors[- ]vente.*attente/.test(q)) {
    const pending = pendingOutflows()
    if (!pending.length) return { text: 'Aucune sortie hors-vente en attente de validation.', agents: [`${BRAND.aiName} · Pertes`], sources: ['Sorties hors-vente'] }
    return {
      text: `${pending.length} déclaration(s) en attente : ${pending.map((o) => `${o.id} (${productById(o.productId)!.name}, ${OUTFLOW_REASON_LABEL[o.reason]}, depuis le ${fmtDate(o.date)})`).join(' ; ')}.`,
      agents: [`${BRAND.aiName} · Pertes`],
      sources: ['Sorties hors-vente'],
      actions: [{ label: 'Valider les sorties hors-vente', to: '/admin/sorties-hors-vente' }],
    }
  }

  if (/prelevement.*attente|demandes? en attente|bon.*attente/.test(q)) {
    const pending = pendingRequisitions()
    const preparing = preparingRequisitions()
    const partial = partialRequisitions()
    return {
      text: `${pending.length} bon(s) en attente, ${preparing.length} en préparation, ${partial.length} partiellement livré(s) et non soldé(s).`,
      agents: [`${BRAND.aiName} · Logistique`],
      sources: ['Bons de prélèvement'],
      actions: [{ label: "Voir les bons de prélèvement", to: '/economat/prelevements' }],
    }
  }

  if (/commande.*cours|reception.*attend|fournisseur.*attend/.test(q)) {
    const open = openPurchaseOrders()
    if (!open.length) return { text: 'Aucune commande fournisseur en attente de réception.', agents: [`${BRAND.aiName} · Achats`], sources: ['Commandes fournisseurs'] }
    return {
      text: `${open.length} commande(s) en cours : ${open.map((po) => `${po.id} auprès de ${supplierName(po.supplierId)} (${po.status === 'partiellement_recue' ? 'partiellement reçue' : 'envoyée'})`).join(' ; ')}.`,
      agents: [`${BRAND.aiName} · Achats`],
      sources: ['Commandes fournisseurs', 'Réceptions'],
      actions: [{ label: 'Voir les commandes', to: '/economat/commandes' }],
    }
  }

  if (/reapprovisionn|a commander|stock central/.test(q)) {
    const list = economatReplenishList()
    if (!list.length) return { text: 'Le stock central couvre actuellement les besoins de tous les produits actifs.', agents: [`${BRAND.aiName} · Achats`], sources: ['Stock Économat'] }
    return {
      text: `${list.length} référence(s) sont sous 30 % de leur stock cible au magasin central : ${list.slice(0, 6).map((l) => l.product.name).join(', ')}${list.length > 6 ? '…' : ''}.`,
      agents: [`${BRAND.aiName} · Achats`],
      sources: ['Stock Économat'],
      actions: [{ label: 'Voir le stock Économat', to: '/economat/stock' }],
    }
  }

  if (/histoire|a surveiller|anomalie|detecte/.test(q)) {
    const stories = hiddenStories()
    return {
      text: stories.map((s) => `• ${s.title}`).join('\n'),
      agents: [`${BRAND.aiName} · Synthèse`],
      sources: ['Mouvements de stock', 'Bons de prélèvement', 'Sorties hors-vente', 'Commandes fournisseurs'],
    }
  }

  return {
    text: `${BRAND.aiName} n'a pas trouvé de réponse calculée précise à cette question. Essayez : « quels produits sont sous le seuil minimum ? », « quelle est la valeur des pertes validées ? » ou le nom d'un produit du catalogue.`,
    agents: [`${BRAND.aiName} · Synthèse`],
    sources: [],
  }
}

export const SUGGESTED_QUESTIONS = [
  'Quels produits sont sous le seuil minimum ?',
  'Quelle est la valeur des pertes validées ce mois-ci ?',
  'Quelles sorties hors-vente sont en attente de validation ?',
  'Quels bons de prélèvement sont en attente ou en préparation ?',
  'Quelles commandes fournisseurs sont en cours de réception ?',
  'Quels produits faut-il réapprovisionner au stock central ?',
  'Quel est le stock de Chivas 18 ans ?',
  'Quel est le stock et le coût moyen pondéré du Poulet ?',
  'Quelles anomalies as-tu détectées récemment ?',
  "Quelle est la valeur de la dernière perte sur le Jameson ?",
]
