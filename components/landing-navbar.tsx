'use client';

import { MenuIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface NavLink {
  name: string;
  href: string;
}

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  const navLinks: NavLink[] = [
    { name: 'Home', href: '/#home' },
    { name: 'Features', href: '/#features' },
    { name: 'Process', href: '/#process' },
    { name: 'Plans', href: '/#pricing' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScrollY.current && currentScroll > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-40 bg-white/70 backdrop-blur-md transition-transform duration-400 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 md:px-16 lg:px-24 xl:px-32 border-b border-blue-100">
          <Link href="/" className="text-xl font-bold text-gray-900">Kudos</Link>

          <div className="hidden md:flex items-center gap-8 text-gray-600">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="hover:text-gray-800">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="px-6 py-2.5 hover:bg-gray-100 rounded-lg">Login</Link>
            <Link href="/signup" className="bg-linear-to-b from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition px-5 py-2 text-white rounded-lg">Get Started</Link>
          </div>

          <button onClick={() => setIsOpen(true)} className="transition active:scale-90 md:hidden">
            <MenuIcon className="size-6.5" />
          </button>
        </div>
      </nav>

      <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-white/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {navLinks.map((link) => (
          <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
            {link.name}
          </Link>
        ))}

        <Link href="/login" onClick={() => setIsOpen(false)} className="px-6 py-2.5">Login</Link>
        <Link href="/signup" onClick={() => setIsOpen(false)} className="bg-linear-to-b from-blue-600 to-indigo-700 px-5 py-2 text-white rounded-lg">Get Started</Link>

        <button onClick={() => setIsOpen(false)} className="rounded-md bg-linear-to-b from-blue-600 to-indigo-700 p-2 text-white ring-white active:ring-2">
          <XIcon />
        </button>
      </div>
      <div className="h-18" />
    </>
  );
}
