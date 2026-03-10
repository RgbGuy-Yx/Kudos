'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { ShieldCheckIcon, WalletIcon, WorkflowIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { connectWallet, accountAddress } = useWallet();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const accounts = await connectWallet();
      
      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        
        // Check if wallet exists in database
        const response = await fetch('/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Connection failed');
        }

        if (data.needsRoleSelection) {
          // New user, redirect to signup page
          router.push(`/signup?wallet=${walletAddress}`);
        } else {
          // Existing user, redirect to dashboard
          const dashboardRoute = data.user.role === 'sponsor' 
            ? '/sponsor/dashboard' 
            : '/dashboard/student';
          router.push(dashboardRoute);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="relative px-4 py-28 md:px-16 lg:px-24 xl:px-32 min-h-[calc(100vh-72px)] flex items-center justify-center bg-[url('/assets/color-splash-light.svg')] dark:bg-[url('/assets/color-splash.svg')] bg-no-repeat bg-cover bg-center">
        <div className="absolute inset-0 bg-purple-50/65 dark:bg-[#140824]/72" />
        <div className="relative w-full max-w-5xl grid md:grid-cols-2 border border-slate-300 dark:border-slate-700/60 rounded-2xl overflow-hidden bg-white/85 dark:bg-slate-900/70 backdrop-blur-sm shadow-2xl shadow-slate-300/40 dark:shadow-black/30">
          <div className="p-8 md:p-10 bg-white/80 dark:bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-300 dark:border-slate-700/70">
            <p className="text-sm text-slate-600 dark:text-slate-400">Welcome Back</p>
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mt-2">Login to Kudos</h1>
            <p className="mt-4 text-sm/6 text-slate-700 dark:text-slate-300">
              Connect your wallet to access sponsor or student dashboards and continue your milestone workflow.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <WalletIcon className="size-5 text-purple-400" />
                <span>Pera Wallet authentication</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <ShieldCheckIcon className="size-5 text-purple-400" />
                <span>Wallet-session sync protection</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <WorkflowIcon className="size-5 text-purple-400" />
                <span>Role-based dashboard routing</span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Wallet Sign In</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-6 text-sm">
              Use the same wallet you registered with.
            </p>

            {accountAddress && (
              <div className="bg-emerald-500/15 text-emerald-300 p-3 rounded-lg text-sm mb-4 border border-emerald-500/30">
                Connected: {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
              </div>
            )}

            {error && (
              <div className="bg-red-500/15 text-red-300 p-3 rounded-lg text-sm mb-4 border border-red-500/30">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {loading ? 'Connecting...' : 'Connect Wallet & Login'}
            </button>

            <p className="text-center text-sm text-slate-700 dark:text-slate-300 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 hover:underline font-semibold">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
