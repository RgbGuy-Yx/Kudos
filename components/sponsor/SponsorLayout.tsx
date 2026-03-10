'use client';

import { ReactNode } from 'react';
import { SearchIcon } from 'lucide-react';

export type SponsorSection = 'overview' | 'projects' | 'active-grant' | 'transactions';

interface SponsorLayoutProps {
  walletAddress: string;
  hasActiveGrant: boolean;
  activeSection: SponsorSection;
  onSectionChange: (section: SponsorSection) => void;
  onLogout: () => void;
  children: ReactNode;
}

const baseItem =
  'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors';

export default function SponsorLayout({
  walletAddress,
  hasActiveGrant,
  activeSection,
  onSectionChange,
  onLogout,
  children,
}: SponsorLayoutProps) {
  const menu: { key: SponsorSection; label: string; hidden?: boolean }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'projects', label: 'Projects' },
    { key: 'active-grant', label: 'Active Grant', hidden: !hasActiveGrant },
    { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen bg-[url('/assets/dark-hero-gradient.svg')] bg-cover bg-top text-slate-100">
      <div className="min-h-screen bg-[#050315]/85">
        <div className="flex w-full flex-col gap-5 px-2 py-4 md:px-4 md:py-5 lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
          <aside className="min-h-screen w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 py-10 px-5 backdrop-blur-sm lg:sticky lg:top-8 lg:w-72">
            <h1 className="text-xl font-semibold tracking-tight">Kudos Sponsor</h1>
            <p className="mt-1 text-xs text-slate-400">{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</p>
            <p className="mt-4 text-xs text-slate-500">Grant operations workspace</p>

            <nav className="mt-5 space-y-2">
              {menu
                .filter((item) => !item.hidden)
                .map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onSectionChange(item.key)}
                    className={`${baseItem} ${
                      activeSection === item.key
                        ? 'border border-purple-500/40 bg-purple-500/20 text-purple-100'
                        : 'border border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
            </nav>

            <button
              onClick={onLogout}
              className="mt-8 w-full rounded-lg border border-rose-600/60 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
            >
              Logout
            </button>
          </aside>

          <main className="min-w-0 flex-1 rounded-2xl border border-slate-700/60 bg-slate-900/65 p-4 backdrop-blur-sm md:p-5">
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/70 p-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                <SearchIcon size={14} className="text-slate-500" />
                <span>Sponsor operations workspace</span>
              </div>
              <div className="rounded-lg border border-purple-500/35 bg-purple-500/12 px-3 py-2 text-xs font-medium text-purple-200">
                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700/50 bg-slate-900/55 p-4 md:p-5">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
