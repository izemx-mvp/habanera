import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '@/store/app-store'
import { notificationsFor } from '@/data/selectors'
import { useDataVersion } from '@/store/data-version'
import { fmtDateTime } from '@/data/selectors'
import type { Role } from '@/data/types'

const SEVERITY_DOT: Record<string, string> = { info: 'bg-copper', warning: 'bg-amber-500', error: 'bg-red-500' }

export function NotificationsBell({ role }: { role: Role }) {
  useDataVersion()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const readIds = useAppStore((s) => s.notifReadIds)
  const deletedIds = useAppStore((s) => s.notifDeletedIds)
  const markRead = useAppStore((s) => s.markNotifRead)
  const markAllRead = useAppStore((s) => s.markAllNotifRead)
  const deleteNotif = useAppStore((s) => s.deleteNotif)

  const all = (role === 'admin' || role === 'economat' || role === 'bar' || role === 'cuisine' ? notificationsFor(role) : []).filter((n) => !deletedIds.includes(n.id))
  const unread = all.filter((n) => !readIds.includes(n.id))

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell size={18} className="text-ink-700 dark:text-ink-200" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9.5px] font-medium flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[440px] flex flex-col rounded-2xl border border-ink-200 bg-white dark:bg-ink-900 dark:border-ink-700 shadow-lift z-50 animate-popIn origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-800">
            <div className="text-[13px] font-medium text-ink-900 dark:text-ink-50">Notifications</div>
            {unread.length > 0 && (
              <button className="text-[11px] text-copper hover:underline flex items-center gap-1" onClick={() => markAllRead(all.map((n) => n.id))}>
                <CheckCheck size={12} />
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {all.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12.5px] text-ink-400">Aucune notification.</div>
            ) : (
              all.map((n) => {
                const isRead = readIds.includes(n.id)
                return (
                  <div key={n.id} className={clsx('px-4 py-3 border-b border-ink-50 dark:border-ink-800 last:border-0 flex gap-2.5 group', !isRead && 'bg-ink-50/50 dark:bg-ink-800/40')}>
                    <span className={clsx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', SEVERITY_DOT[n.severity])} />
                    <div className="min-w-0 flex-1">
                      <Link to={n.link ?? '#'} onClick={() => setOpen(false)} className="text-[12.5px] font-medium text-ink-900 dark:text-ink-50 hover:text-copper leading-snug block">
                        {n.title}
                      </Link>
                      <div className="text-[11.5px] text-ink-500 dark:text-ink-400 mt-0.5">{n.detail}</div>
                      <div className="text-[10.5px] text-ink-400 dark:text-ink-500 mt-1">{fmtDateTime(n.date)}</div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!isRead && (
                        <button className="p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-700" title="Marquer comme lue" onClick={() => markRead(n.id)}>
                          <Check size={13} className="text-ink-500" />
                        </button>
                      )}
                      <button className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950" title="Supprimer" onClick={() => deleteNotif(n.id)}>
                        <Trash2 size={13} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
