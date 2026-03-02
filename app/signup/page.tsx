'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { UserRole } from '@/lib/types';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { connectWallet, accountAddress } = useWallet();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: 'student' as UserRole,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!formData.name || !formData.email || !formData.organization) {
      setError('Please fill in all fields');
      return;
    }
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    setStep(2);
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      const accounts = await connectWallet();
      
      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        
        // Register user with form data
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            ...formData,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // Registration successful, redirect to dashboard
        const dashboardRoute = formData.role === 'sponsor' 
          ? '/sponsor/dashboard' 
          : '/dashboard/student';
        router.push(dashboardRoute);
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
      <main className="relative px-4 py-24 md:px-16 lg:px-24 xl:px-32 min-h-[calc(100vh-72px)] flex items-center justify-center bg-[url('/assets/dark-hero-gradient.svg')] bg-no-repeat bg-cover">
        <div className="absolute inset-0 bg-[#050315]/80" />
        <div className="relative w-full max-w-5xl grid md:grid-cols-2 border border-slate-700/60 rounded-2xl overflow-hidden bg-slate-900/70 backdrop-blur-sm shadow-2xl shadow-black/30">
          <div className="p-8 md:p-10 bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-700/70">
            <p className="text-sm text-slate-400">Create Account</p>
            <h1 className="text-4xl font-semibold text-white mt-2">Join Kudos</h1>
            <p className="mt-4 text-sm/6 text-slate-300">
              Set your profile and role first, then connect your Pera Wallet to activate your sponsor or student dashboard.
            </p>

            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <p>Step 1: Profile details + role selection</p>
              <p>Step 2: Wallet connection and registration</p>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-semibold text-white mb-2">{step === 1 ? 'Profile Setup' : 'Wallet Connection'}</h2>
            <p className="text-slate-300 mb-6 text-sm">
              {step === 1 ? 'Fill in your details to continue.' : 'Connect your wallet to complete account creation.'}
            </p>

            {step === 1 ? (
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-700 bg-slate-950/60 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-700 bg-slate-950/60 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Organization *
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-4 py-2 border border-slate-700 bg-slate-950/60 text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Your school or company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Select Your Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'student'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                      : 'border-slate-700 text-slate-200 hover:border-slate-500 bg-slate-950/40'
                  }`}
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="font-semibold">Student</div>
                  <div className="text-xs text-slate-300 mt-1">Receive funding</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'sponsor' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'sponsor'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                      : 'border-slate-700 text-slate-200 hover:border-slate-500 bg-slate-950/40'
                  }`}
                >
                  <div className="text-2xl mb-1">💼</div>
                  <div className="font-semibold">Sponsor</div>
                  <div className="text-xs text-slate-300 mt-1">Fund projects</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/15 text-red-300 p-3 rounded-lg text-sm border border-red-500/30">
                {error}
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Next: Connect Wallet
            </button>

            <p className="text-center text-sm text-slate-300">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-300 hover:text-purple-200 hover:underline font-semibold">
                Login here
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700/70">
              <p className="text-sm text-slate-200 mb-2">
                <strong>Step 2:</strong> Connect your Pera Wallet
              </p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>✓ Name: {formData.name}</p>
                <p>✓ Email: {formData.email}</p>
                <p>✓ Organization: {formData.organization}</p>
                <p>✓ Role: {formData.role === 'student' ? '🎓 Student' : '💼 Sponsor'}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-300 mb-4">
                Connect your Pera Wallet to complete registration
              </p>
              
              {accountAddress && (
                  <div className="bg-emerald-500/15 text-emerald-300 p-3 rounded-lg text-sm mb-4 border border-emerald-500/30">
                  Connected: {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/15 text-red-300 p-3 rounded-lg text-sm border border-red-500/30">
                {error}
              </div>
            )}

            <button
              onClick={handleConnectWallet}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {loading ? 'Connecting...' : 'Connect Pera Wallet'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-slate-800 text-slate-200 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Back
            </button>
          </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
