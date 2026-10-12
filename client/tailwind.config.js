/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Échelle "ink" = palette brune HABANERA (texte, fonds sombres, boutons)
        ink: {
          DEFAULT: '#1A100A',
          950: '#120B07', // fond d'application en mode sombre
          900: '#1A100A', // couleur principale
          800: '#241A14', // texte principal
          700: '#3B2920', // brun secondaire
          600: '#5A4536',
          500: '#786B60', // texte secondaire
          400: '#9C9087',
          300: '#C9C0B7',
          200: '#E4DED7',
          100: '#F2EEE9',
          50: '#F7F4F0', // fond clair
        },
        // Accents HABANERA
        copper: {
          DEFAULT: '#B7794B',
          soft: '#B7794B22',
        },
        gold: {
          DEFAULT: '#D8B878',
          soft: '#D8B87822',
        },
        heat: {
          cold: '#3B82F6',
          warm: '#F59E0B',
          hot: '#DC2626',
        },
      },
      letterSpacing: {
        label: '0.18em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26,16,10,0.05), 0 8px 24px -12px rgba(26,16,10,0.18)',
        lift: '0 12px 40px -16px rgba(26,16,10,0.3)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.35 },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, -3%) scale(1.05)' },
        },
        blobA: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(4%,-6%) scale(1.08)' },
          '66%': { transform: 'translate(-3%,3%) scale(0.96)' },
        },
        blobB: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-5%,5%) scale(1.1)' },
        },
        blobC: {
          '0%, 100%': { transform: 'translate(0,0) rotate(0deg)' },
          '50%': { transform: 'translate(3%,-4%) rotate(8deg)' },
        },
        popIn: {
          '0%': { opacity: 0, transform: 'scale(.96) translateY(-4px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .45s cubic-bezier(.2,.8,.2,1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        blobA: 'blobA 22s ease-in-out infinite',
        blobB: 'blobB 26s ease-in-out infinite',
        blobC: 'blobC 30s ease-in-out infinite',
        popIn: 'popIn .18s cubic-bezier(.2,.8,.2,1) both',
        slideInRight: 'slideInRight .3s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
