import type { Config } from 'tailwindcss'
import { palette } from './src/lib/theme/palette'

// ---------------------------------------------------------------------------
// babelForge Clinical Design System
// Colors are NOT defined here — they're computed by the color engine in
// src/lib/theme/palette.ts. Single source of truth shared with CSS vars
// (cssVars.ts), EEG bands (lib/signal/bands.ts), and brain network legend
// (lib/engine/topology.ts).
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
        canvas: palette.canvas,
        surface: palette.surface,
        ink: palette.ink,
        line: palette.line,
        accent: palette.accent,
        clinical: palette.clinical,
        ok: palette.ok,
        warn: palette.warn,
        crit: palette.crit,
        info: palette.info,
        band: palette.bands,
        region: palette.regions,
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
