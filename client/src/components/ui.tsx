import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="px-5 lg:px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeUp">
      <div>
        <h1 className="h-display text-[28px] md:text-[34px] leading-[1.05]">{title}</h1>
        {subtitle && <p className="mt-2 text-[13.5px] text-ink-500 dark:text-ink-400 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('px-5 lg:px-8 pb-8', className)}>{children}</section>
}

export function Card({ children, className, dark, title, action }: { children: ReactNode; className?: string; dark?: boolean; title?: string; action?: ReactNode }) {
  return (
    <div className={clsx(dark ? 'card-dark' : 'card', 'p-5', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <div className={dark ? 'label-dark' : 'label'}>{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Stat({ label, value, delta, hint, dark, tone, to }: { label: string; value: string; delta?: string; hint?: string; dark?: boolean; tone?: 'error' | 'warning' | 'success'; to?: string }) {
  const Wrapper = to ? Link : 'div'
  const wrapperProps = to ? { to } : {}
  return (
    <Wrapper {...(wrapperProps as any)} className={clsx(dark ? 'card-dark' : 'card', 'p-5 block', to && 'hover:border-copper dark:hover:border-copper transition-colors cursor-pointer group')}>
      <div className={dark ? 'label-dark' : 'label'}>{label}</div>
      <div
        className={clsx(
          'mt-3 text-[28px] font-light tracking-tight leading-none',
          dark
            ? 'text-white'
            : tone === 'error'
              ? 'text-red-600 dark:text-red-400'
              : tone === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : tone === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-ink-900 dark:text-ink-50',
        )}
      >
        {value}
      </div>
      <div className={clsx('mt-2 text-[11px] leading-snug', dark ? 'text-ink-400' : 'text-ink-500 dark:text-ink-400')}>
        {delta && <span className={clsx('font-medium mr-1', dark ? 'text-white' : 'text-ink-900 dark:text-ink-100')}>{delta}</span>}
        {hint}
      </div>
    </Wrapper>
  )
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('chip', className)}>{children}</span>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-[12.5px] text-ink-500 dark:text-ink-400 py-10 text-center border border-dashed border-ink-200 dark:border-ink-700 rounded-xl">{children}</div>
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-[11.5px] font-medium text-ink-600 dark:text-ink-300 mb-1.5">{children}</label>
}
