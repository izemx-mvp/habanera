import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import clsx from 'clsx'
import { Empty } from './ui'

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  searchPlaceholder = 'Rechercher…',
  searchKeys,
  pageSize = 10,
  emptyLabel = 'Aucun résultat.',
}: {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  searchKeys?: (row: T) => string
  pageSize?: number
  emptyLabel?: string
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let r = rows
    if (query && searchKeys) {
      const q = query.toLowerCase()
      r = r.filter((row) => searchKeys(row).toLowerCase().includes(q))
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sortValue) {
        r = [...r].sort((a, b) => {
          const va = col.sortValue!(a)
          const vb = col.sortValue!(b)
          const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
    }
    return r
  }, [rows, query, sortKey, sortDir, columns, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div>
      {searchKeys && (
        <div className="mb-4 relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <Empty>{emptyLabel}</Empty>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-800/40">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={clsx(
                        'text-left px-4 py-3 font-medium text-ink-500 dark:text-ink-400 text-[11px] uppercase tracking-label select-none',
                        c.sortValue && 'cursor-pointer hover:text-ink-900 dark:hover:text-ink-100',
                        c.className,
                      )}
                      onClick={() => {
                        if (!c.sortValue) return
                        if (sortKey === c.key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                        else {
                          setSortKey(c.key)
                          setSortDir('asc')
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sortKey === c.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr
                    key={i}
                    className={clsx('border-b border-ink-100 dark:border-ink-800 last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-ink-50/60 dark:hover:bg-ink-800/40')}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={clsx('px-4 py-3 align-middle text-ink-800 dark:text-ink-200', c.className)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 dark:border-ink-800 text-[12px] text-ink-500 dark:text-ink-400">
              <span>
                {filtered.length} résultat(s) · page {page + 1}/{totalPages}
              </span>
              <div className="flex gap-2">
                <button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Précédent
                </button>
                <button className="btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
