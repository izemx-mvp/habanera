import { Wine, UtensilsCrossed, Layers } from 'lucide-react'
import clsx from 'clsx'

export type ServiceScope = 'all' | 'bar' | 'cuisine'

interface ServiceScopeSelectorProps {
  value: ServiceScope
  onChange: (value: ServiceScope) => void
  showAll?: boolean
  className?: string
}

export function ServiceScopeSelector({
  value,
  onChange,
  showAll = true,
  className,
}: ServiceScopeSelectorProps) {
  return (
    <div className={clsx('inline-flex items-center p-1 bg-ink-100 dark:bg-ink-800/80 rounded-xl border border-ink-200 dark:border-ink-700/60 shadow-xs', className)}>
      {showAll && (
        <button
          type="button"
          onClick={() => onChange('all')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            value === 'all'
              ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-xs'
              : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100'
          )}
        >
          <Layers size={13} className={value === 'all' ? 'text-copper' : ''} />
          <span>Tous les services</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange('bar')}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          value === 'bar'
            ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-xs'
            : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100'
        )}
      >
        <Wine size={13} className={value === 'bar' ? 'text-copper' : ''} />
        <span>Espace Bar</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('cuisine')}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          value === 'cuisine'
            ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-xs'
            : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100'
        )}
      >
        <UtensilsCrossed size={13} className={value === 'cuisine' ? 'text-copper' : ''} />
        <span>Espace Cuisine</span>
      </button>
    </div>
  )
}
