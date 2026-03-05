'use client';

import { Bell, Plus, User } from 'lucide-react';

interface TopBarProps {
  pageTitle: string;
  unreadCount: number;
  onOpenProposalModal: () => void;
  onOpenNotifications: () => void;
  userName?: string;
}

export default function TopBar({
  pageTitle,
  unreadCount,
  onOpenProposalModal,
  onOpenNotifications,
  userName,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/6 bg-[#0B0F1E]/80 backdrop-blur-xl px-6 py-3">
      <h1 className="text-lg font-bold text-white">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          onClick={onOpenNotifications}
          className="relative size-9 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Notifications"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-[9px] font-bold text-white inline-flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="size-8 rounded-full bg-[#1E1B4B] border border-[#7C3AED]/40 inline-flex items-center justify-center">
          <User className="size-4 text-purple-300" />
        </div>

        {/* Submit proposal CTA */}
        <button
          onClick={onOpenProposalModal}
          className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-500/20"
        >
          <Plus className="size-4" />
          Submit Proposal
        </button>
      </div>
    </header>
  );
}
