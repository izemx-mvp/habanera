import { useRef, useState } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '@/store/app-store'
import { ask, SUGGESTED_QUESTIONS, type AiAnswer } from '@/lib/ai-engine'
import { BRAND } from '@/data/brand'
import { Link } from 'react-router-dom'

export function AiSidebar() {
  const open = useAppStore((s) => s.aiOpen)
  const setOpen = useAppStore((s) => s.setAiOpen)
  const width = useAppStore((s) => s.aiWidth)
  const setWidth = useAppStore((s) => s.setAiWidth)
  const messages = useAppStore((s) => s.aiMessages)
  const push = useAppStore((s) => s.pushAiMessage)
  const [input, setInput] = useState('')
  const dragging = useRef(false)

  const asked = new Set(messages.filter((m) => m.role === 'user').map((m) => m.text))
  const suggestions = SUGGESTED_QUESTIONS.filter((q) => !asked.has(q)).slice(0, 4)

  function send(text: string) {
    if (!text.trim()) return
    push({ id: `u-${Date.now()}`, role: 'user', text, at: new Date().toISOString() })
    const answer: AiAnswer = ask(text)
    push({ id: `a-${Date.now()}`, role: 'assistant', text: answer.text, at: new Date().toISOString() })
    setInput('')
  }

  function onDragStart(e: React.MouseEvent) {
    dragging.current = true
    const startX = e.clientX
    const startW = width
    function onMove(ev: MouseEvent) {
      if (!dragging.current) return
      setWidth(startW - (ev.clientX - startX))
    }
    function onUp() {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-ink-900 text-white pl-4 pr-5 py-3 shadow-lift hover:bg-ink-700 transition dark:bg-copper dark:text-ink-950 dark:hover:bg-gold"
          onClick={() => setOpen(true)}
        >
          <Sparkles size={16} />
          <span className="text-[13px] font-medium">{BRAND.aiName}</span>
        </button>
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-40 bg-white dark:bg-ink-900 border-l border-ink-200 dark:border-ink-800 shadow-lift flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width }}
      >
        <div onMouseDown={onDragStart} className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-copper/40" />
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-ink-200 dark:border-ink-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-ink-900 text-white dark:bg-copper dark:text-ink-950 flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <div>
              <div className="text-[13.5px] font-medium text-ink-900 dark:text-ink-50">{BRAND.aiName}</div>
              <div className="text-[11px] text-ink-500 dark:text-ink-400">Moteur déterministe · lecture seule</div>
            </div>
          </div>
          <button className="p-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800" onClick={() => setOpen(false)} aria-label="Fermer">
            <X size={17} className="dark:text-ink-200" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-[12.5px] text-ink-500 dark:text-ink-400 leading-relaxed">
              Posez une question sur les stocks, les pertes, les bons de prélèvement ou les commandes fournisseurs. {BRAND.aiName} calcule la réponse à partir des données enregistrées.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={clsx(
                'rounded-2xl px-4 py-2.5 text-[13px] whitespace-pre-line max-w-[92%]',
                m.role === 'user' ? 'bg-ink-900 text-white ml-auto dark:bg-copper dark:text-ink-950' : 'bg-ink-50 text-ink-800 dark:bg-ink-800 dark:text-ink-100',
              )}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} className="chip hover:border-ink-900 dark:hover:border-copper" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="border-t border-ink-200 dark:border-ink-800 p-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input className="input" placeholder="Poser une question…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn-primary btn-sm !rounded-full !px-3" type="submit" aria-label="Envoyer">
              <Send size={14} />
            </button>
          </form>
          <p className="mt-2 text-[10.5px] text-ink-400 dark:text-ink-500">
            <Link to="/a-propos" className="underline hover:text-ink-700 dark:hover:text-ink-200">
              À propos du MVP
            </Link>
          </p>
        </div>
      </aside>
    </>
  )
}
