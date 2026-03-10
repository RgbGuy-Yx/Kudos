'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';

interface User {
  id: string;
  walletAddress: string;
  role: 'student' | 'sponsor';
  name?: string;
  email?: string;
  organization?: string;
}

export function useAuth(requireWalletSync = false) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletMismatch, setWalletMismatch] = useState(false);
  const router = useRouter();
  const { accountAddress, verifyWalletSession, disconnectWallet } = useWallet();

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await disconnectWallet();
      setUser(null);
      setWalletMismatch(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [disconnectWallet, router]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Verify wallet matches session whenever wallet changes
  useEffect(() => {
    if (!user || !requireWalletSync) return;

    if (!accountAddress) {
      // Wallet disconnected but user session exists - force logout
      console.warn('Wallet disconnected but session active - forcing logout');
      handleLogout();
      return;
    }

    // Check if connected wallet matches session wallet
    const isValid = verifyWalletSession(user.walletAddress);
    
    if (!isValid) {
      setWalletMismatch(true);
      console.error('Wallet mismatch detected - forcing logout');
      
      // Force logout after brief delay to show error
      setTimeout(() => {
        handleLogout();
      }, 2000);
    } else {
      setWalletMismatch(false);
    }
  }, [accountAddress, user, requireWalletSync, verifyWalletSession, handleLogout]);

  const logout = handleLogout;

  return { 
    user, 
    loading, 
    logout, 
    refetch: fetchUser,
    walletMismatch,
    isWalletConnected: !!accountAddress,
  };
}
