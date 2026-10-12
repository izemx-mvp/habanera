import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export function Drawer({ open, onClose, title, subtitle, children, actions, width = 480 }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; actions?: ReactNode; width?: number }) {
  return (
    <div className={clsx('fixed inset-0 z-50 transition-opacity', open ? 'pointer-events-auto' : 'pointer-events-none opacity-0')}>
      <div className={clsx('absolute inset-0 bg-black/30 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div
        className={clsx(
          'absolute inset-y-0 right-0 bg-white dark:bg-ink-900 border-l border-ink-200 dark:border-ink-800 shadow-lift flex flex-col transition-transform duration-300 w-full',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-ink-200 dark:border-ink-800">
          <div>
            <h2 className="text-[18px] font-medium text-ink-900 dark:text-ink-50 leading-tight">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-ink-500 dark:text-ink-400 mt-1">{subtitle}</p>}
          </div>
          <button className="p-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800" onClick={onClose} aria-label="Fermer">
            <X size={18} className="dark:text-ink-200" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-ink-800 dark:text-ink-200">{children}</div>
        {actions && <div className="border-t border-ink-200 dark:border-ink-800 px-6 py-4 flex items-center justify-end gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function ConfirmModal({ open, onClose, title, description, confirmLabel = 'Confirmer', danger, onConfirm, children }: { open: boolean; onClose: () => void; title: string; description?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; children?: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-700 shadow-lift w-full max-w-md p-6 animate-fadeUp">
        <h3 className="text-[17px] font-medium text-ink-900 dark:text-ink-50">{title}</h3>
        {description && <p className="text-[13px] text-ink-500 dark:text-ink-400 mt-2 leading-relaxed">{description}</p>}
        {children && <div className="mt-4 text-ink-800 dark:text-ink-200">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost btn-sm" onClick={onClose}>
            Annuler
          </button>
          <button
            className={clsx('btn btn-sm text-white', danger ? 'bg-red-600 hover:bg-red-700' : 'bg-ink-900 hover:bg-ink-700 dark:bg-copper dark:text-ink-950 dark:hover:bg-gold')}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
