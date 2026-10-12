import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { PERSONAS } from '@/data/referentials'
import { BRAND, IZEMX } from '@/data/brand'
import { useAppStore } from '@/store/app-store'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Connexion() {
  const navigate = useNavigate()
  const setPersona = useAppStore((s) => s.setPersona)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Partie gauche — identité HABANERA, fond animé multi-couches */}
      <div className="relative lg:w-1/2 min-h-[320px] lg:min-h-screen login-aurora text-white flex flex-col justify-between p-10 lg:p-16 overflow-hidden">
        {/* Couche 2 (midground) : blobs géométriques flous */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-gold/20 blur-3xl animate-blobA" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-copper/25 blur-3xl animate-blobB" />
          <div className="absolute top-1/3 right-1/4 w-56 h-56 rounded-3xl bg-white/5 blur-2xl animate-blobC" />
        </div>
        {/* Couche 3 (foreground) : formes fines, grille discrète */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]" aria-hidden="true">
          <div className="absolute inset-0 grid-paper" style={{ filter: 'invert(1)' }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg className="absolute top-10 right-10 w-24 h-24 text-gold/30 animate-blobC" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          </svg>
          <svg className="absolute bottom-24 left-16 w-16 h-16 text-white/10" viewBox="0 0 100 100" fill="none">
            <rect x="4" y="4" width="92" height="92" rx="20" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10">
          <img src={BRAND.logoDark} alt={BRAND.name} className="h-16 w-16 rounded-full object-cover shadow-lift" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="label-dark mb-3">{BRAND.tagline}</div>
          <h1 className="text-[40px] lg:text-[52px] font-light leading-[1.05] tracking-tight">{BRAND.name}</h1>
          <p className="mt-5 text-[15px] text-white/80 leading-relaxed">{BRAND.welcome}</p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/50">
          <ShieldCheck size={14} />
          <span>MVP conçu et développé par IZEMX</span>
        </div>
      </div>

      {/* Partie droite — accès aux espaces */}
      <div className="relative lg:w-1/2 flex-1 flex items-center justify-center p-8 lg:p-16 bg-white dark:bg-ink-950 transition-colors">
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="label mb-2">Connexion</div>
          <h2 className="h-display text-[28px] mb-2">Bienvenue chez {BRAND.name}</h2>
          <p className="text-[13px] text-ink-500 dark:text-ink-400 mb-8">Choisissez votre espace de démonstration.</p>

          <div className="space-y-3">
            {PERSONAS.map((p, i) => (
              <div
                key={p.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-ink-900 dark:hover:border-copper transition-colors animate-fadeUp"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 rounded-full text-white font-medium flex items-center justify-center text-[13px]" style={{ background: p.color }}>
                    {p.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-ink-900 dark:text-ink-50 truncate">{p.roleLabel}</div>
                    <div className="text-[11.5px] text-ink-500 dark:text-ink-400 truncate">{p.name}</div>
                  </div>
                </div>
                <button
                  className="btn-primary btn-sm shrink-0 w-full sm:w-auto justify-center"
                  onClick={() => {
                    setPersona(p.id)
                    navigate(p.home)
                  }}
                >
                  Se connecter
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[11px] text-ink-400 dark:text-ink-500 leading-relaxed">
            Environnement de démonstration — comptes et données simulés. {IZEMX.signature}.
          </p>
        </div>
      </div>
    </div>
  )
}
