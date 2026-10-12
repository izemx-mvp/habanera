import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const dark = theme === 'dark'

  return (
    <button
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-ink-200 bg-ink-100 transition-colors dark:border-ink-700 dark:bg-ink-800"
    >
      <span
        className="absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-soft transition-transform duration-300 dark:bg-ink-900"
        style={{ transform: dark ? 'translateX(24px)' : 'translateX(0)' }}
      >
        {dark ? <Moon size={13} className="text-gold" /> : <Sun size={13} className="text-copper" />}
      </span>
    </button>
  )
}
