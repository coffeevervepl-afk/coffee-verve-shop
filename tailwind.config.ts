import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // All brand colors via CSS variables — swap in one place
        brand: {
          bg:      'var(--color-bg)',
          surface: 'var(--color-surface)',
          border:  'var(--color-border)',
          text:    'var(--color-text)',
          muted:   'var(--color-muted)',
          accent:  'var(--color-accent)',
          gold:    'var(--color-gold)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease both',
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-left': 'slideLeft 0.35s ease both',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideLeft: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
export default config
