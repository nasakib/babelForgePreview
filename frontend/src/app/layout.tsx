import type { Metadata, Viewport } from 'next'
import { Inter_Tight, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { AIProvider } from '@/context/AIContext'
import { UserModeProvider } from '@/context/UserModeContext'
import AIAssistant from '@/components/AIAssistant'
import StatusBar from '@/components/palantir/StatusBar'
import CommandPalette from '@/components/palantir/CommandPalette'
import { palette } from '@/lib/theme/palette'
import { cssVarBlock } from '@/lib/theme/cssVars'

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
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.json`,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: palette.canvas,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${interTight.variable} ${jetbrains.variable}`}>
      <head>
        {/* Color engine: inject palette as CSS custom properties so any
            stylesheet, inline style, or third-party CSS reads the same
            tokens the TS/Tailwind layers do. Single source of truth. */}
        <style id="forge-theme" dangerouslySetInnerHTML={{ __html: cssVarBlock() }} />
      </head>
      <body className="font-sans antialiased h-screen-dvh flex flex-col overflow-hidden bg-canvas text-ink">
        <UserModeProvider>
          <AIProvider>
            <Navbar />
            <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative bg-void">
              {children}
            </main>
            <StatusBar />
            <AIAssistant />
            <CommandPalette />
          </AIProvider>
        </UserModeProvider>
      </body>
    </html>
  )
}
