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
          <AIAssistant />
        </AIProvider>
      </body>
    </html>
  )
}
