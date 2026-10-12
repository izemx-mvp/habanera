import clsx from 'clsx'

const TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'copper'> = {
  // réquisitions
  brouillon: 'neutral',
  en_attente: 'warning',
  en_preparation: 'copper',
  partiellement_livre: 'warning',
  livre: 'success',
  rejete: 'error',
  // commandes
  envoyee: 'warning',
  partiellement_recue: 'copper',
  receptionnee: 'success',
  annulee: 'error',
  // sorties hors-vente
  acceptee: 'success',
  rejetee: 'error',
  // alertes
  active: 'error',
  resolue: 'success',
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = TONE[status] ?? 'neutral'
  return <span className={clsx(`badge-${tone}`)}>{label}</span>
}
