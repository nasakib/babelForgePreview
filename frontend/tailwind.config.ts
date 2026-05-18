import type { Config } from 'tailwindcss'

// ---------------------------------------------------------------------------
// babelForge Clinical Design System
// Inspired by IBM Carbon, Philips IntelliVue, Bloomberg Terminal.
// ---------------------------------------------------------------------------

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#05070d',
        surface: {
          0: '#0a0d14',
          50: '#0e1219',
          100: '#141923',
          200: '#1b2230',
          300: '#252d3d',
          400: '#323b4d',
          500: '#4a5468',
        },
        ink: {
          DEFAULT: '#e6eaf2',
          subtle: '#aab1c0',
          muted: '#6a7286',
          dim: '#454c5d',
        },
        line: {
          DEFAULT: '#1f2735',
          strong: '#2c3548',
        },
        accent: {
          50: '#e6f0ff',
          200: '#9cc0ff',
          400: '#4d8dff',
          500: '#1f6dff',
          600: '#0058e6',
          700: '#0045b4',
        },
        ok: '#10b981',
        warn: '#f59e0b',
        crit: '#ef4444',
        info: '#06b6d4',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter Tight', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.04em' }],
        'micro': ['0.625rem', { lineHeight: '0.75rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        sharp: '2px',
        clinical: '4px',
      },
      letterSpacing: {
        widest2: '0.18em',
      },
      animation: {
        'fade-in-up': 'fadeInUp .35s ease-out both',
        'spin-slow': 'spin 18s linear infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
