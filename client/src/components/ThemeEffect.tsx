import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'

export function ThemeEffect() {
  const theme = useAppStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])
  return null
}
