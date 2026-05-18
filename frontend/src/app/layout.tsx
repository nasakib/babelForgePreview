import type { Metadata, Viewport } from 'next'
import { Inter_Tight, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { AIProvider } from '@/context/AIContext'
import AIAssistant from '@/components/AIAssistant'

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'babelForge | Precision Neuroscience Engine',
  description:
    'Computational topology + Kuramoto phase dynamics + precision-compound optimization for clinical neuroscience research.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#05070d',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${interTight.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased min-h-screen-dvh flex flex-col lg:overflow-hidden bg-canvas text-ink">
        <AIProvider>
          <Navbar />
          <main className="flex-1 flex flex-col lg:overflow-hidden relative bg-void">
            {children}
          </main>
          <footer className="flex-none p-2 border-t border-line bg-surface-50 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest2 text-ink-muted z-30 relative">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="status-dot ok shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"></span>
                <span className="text-ok font-bold">babelForge Core Engine v2.1.0</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-accent-500">SYNC: LOCKED</span>
                <span className="text-ink-dim">|</span>
                <span>FREQ: 120Hz</span>
              </div>
            </div>
            <div className="hidden sm:block text-ink-subtle font-bold tracking-widest">
              FOR CLINICAL AND RESEARCH PURPOSES ONLY
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden lg:block">SYS.OP: NORMAL</span>
              <span className="text-ink-dim">&copy; {new Date().getFullYear()} babelForge</span>
            </div>
          </footer>
          <AIAssistant />
        </AIProvider>
      </body>
    </html>
  )
}
