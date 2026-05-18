import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'babelForge | Precision Neuroscience Engine',
  description: 'Computational Topology and Pharmacopeia Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased selection:bg-indigo-500/40 selection:text-slate-900 min-h-screen flex flex-col overflow-hidden font-sans`}>
        <Navbar />
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden relative bg-slate-50">
          {children}
        </div>
      </body>
    </html>
  )
}
