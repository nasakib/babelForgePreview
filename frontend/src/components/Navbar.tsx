"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-50 relative">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span className="font-bold text-lg tracking-tight">
          babelForge <span className="text-indigo-600">Engine</span>
        </span>
      </Link>
      
      <div className="hidden lg:flex gap-4">
        <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">
          Methodology & Validity
        </button>
        <Link href="/11d-projection" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/11d-projection') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
          11D Legacy
        </Link>
        <Link href="/stack-simulator" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/stack-simulator') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
          Stack Builder
        </Link>
        <Link href="/compounds" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/compounds') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
          Compounds
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden flex items-center">
        <button
          className="text-slate-500 hover:text-indigo-600 focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg absolute w-full top-14 left-0`}>
        <button className="block w-full text-left px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50">
          Methodology & Validity
        </button>
        <Link href="/11d-projection" className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50">
          11D Legacy
        </Link>
        <Link href="/stack-simulator" className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50">
          Stack Builder
        </Link>
        <Link href="/signal-analyzer" className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50">
          Signal Analyzer
        </Link>
        <Link href="/compounds" className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50">
          Compounds
        </Link>
      </div>
    </nav>
  );
}unds
        </Link>
      </div>
    </nav>
  );
}