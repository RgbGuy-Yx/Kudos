'use client';

import {
  LayoutDashboard,
  FileText,
  Award,
  CheckCircle,
  Wallet,
  ArrowLeftRight,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type StudentSection =
  | 'dashboard'
  | 'proposals'
  | 'active-grant'
  | 'milestones'
  | 'earnings'
  | 'transactions'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  walletAddress: string;
  isVerified: boolean;
  activeSection: StudentSection;
  onSectionChange: (s: StudentSection) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  notificationCount: number;
}

const mainNav: { key: StudentSection; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'proposals', label: 'My Proposals', icon: FileText },
  { key: 'active-grant', label: 'Active Grant', icon: Award },
  { key: 'milestones', label: 'Milestones', icon: CheckCircle },
];

const financeNav: { key: StudentSection; label: string; icon: typeof Wallet }[] = [
  { key: 'earnings', label: 'Earnings', icon: Wallet },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
];

const otherNav: { key: StudentSection; label: string; icon: typeof Bell }[] = [
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  walletAddress,
  isVerified,
  activeSection,
  onSectionChange,
  onLogout,
  collapsed,
  onToggleCollapse,
  notificationCount,
}: SidebarProps) {
  const btn =
    'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200';
  const active = 'bg-[#7C3AED]/20 text-purple-200 border border-[#7C3AED]/40';
  const inactive =
    'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent';

  const renderItem = (
    item: { key: StudentSection; label: string; icon: typeof LayoutDashboard },
    badge?: number,
  ) => {
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        onClick={() => onSectionChange(item.key)}
        className={`${btn} ${activeSection === item.key ? active : inactive}`}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="size-4.5 shrink-0" />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto size-5 rounded-full bg-red-500 text-[10px] font-bold text-white inline-flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 flex flex-col border-r border-white/6 bg-[#0B0F1E] transition-all duration-300 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/6">
        <Sparkles className="size-6 text-[#7C3AED] shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white">Kudos</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto size-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Main
            </p>
          )}
          <div className="space-y-1">
            {mainNav.map((item) => renderItem(item))}
          </div>
        </div>

        {/* Finance */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Finance
            </p>
          )}
          <div className="space-y-1">
            {financeNav.map((item) => renderItem(item))}
          </div>
        </div>

        {/* Other */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Other
            </p>
          )}
          <div className="space-y-1">
            {otherNav.map((item) =>
              renderItem(item, item.key === 'notifications' ? notificationCount : undefined),
            )}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="shrink-0 px-3 pb-4 space-y-3 border-t border-white/6 pt-4">
        {/* Help */}
        <button
          className={`${btn} ${inactive}`}
          title={collapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle className="size-4.5 shrink-0" />
          {!collapsed && <span>Help &amp; Support</span>}
        </button>

        {/* Wallet card */}
        {!collapsed && (
          <div className="rounded-xl border border-[#7C3AED]/30 bg-[#1E1B4B] p-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-400 font-medium">
                {isVerified ? 'Verified' : 'Connected'}
              </span>
            </div>
            <p className="mt-1.5 font-mono text-xs text-slate-300 truncate">
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`${btn} border-rose-500/30 text-rose-300 hover:bg-rose-500/10`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="size-4.5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
