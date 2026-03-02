'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { useRouter } from 'next/navigation';
import algosdk from 'algosdk';

interface WalletContextType {
  peraWallet: PeraWalletConnect | null;
  accountAddress: string | null;
  connectWallet: () => Promise<string[]>;
  disconnectWallet: () => void;
  signTransaction: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
  isConnected: boolean;
  isVerifying: boolean;
  verifyWalletSession: (sessionWallet: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  // Handle wallet disconnect - force logout
  const handleWalletDisconnect = useCallback(async () => {
    console.log('Wallet disconnected - logging out');
    setAccountAddress(null);
    
    // Clear session
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  useEffect(() => {
    const wallet = new PeraWalletConnect();
    setPeraWallet(wallet);

    // Try to reconnect to existing session
    wallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    }).catch(console.error);

    // Listen for wallet disconnect events
    wallet.connector?.on('disconnect', handleWalletDisconnect);

    return () => {
      wallet.connector?.off('disconnect', handleWalletDisconnect);
    };
  }, [handleWalletDisconnect]);

  const connectWallet = async () => {
    if (!peraWallet) throw new Error('Pera Wallet not initialized');
    
    const accounts = await peraWallet.connect();
    setAccountAddress(accounts[0]);
    return accounts;
  };

  const disconnectWallet = async () => {
    if (peraWallet) {
      peraWallet.disconnect();
      setAccountAddress(null);
    }
    
    // Also logout from session
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Verify connected wallet matches session wallet
  const verifyWalletSession = useCallback((sessionWallet: string): boolean => {
    if (!accountAddress) {
      console.warn('No wallet connected');
      return false;
    }

    if (accountAddress.toLowerCase() !== sessionWallet.toLowerCase()) {
      console.error('Wallet mismatch!', {
        connected: accountAddress,
        session: sessionWallet,
      });
      return false;
    }

    return true;
  }, [accountAddress]);

  // Sign transactions with Pera Wallet
  const signTransaction = useCallback(async (txns: algosdk.Transaction[]): Promise<Uint8Array[]> => {
    if (!peraWallet) {
      throw new Error('Pera Wallet not initialized');
    }

    if (!accountAddress) {
      throw new Error('Wallet not connected');
    }

    // Convert transactions to encoded format for signing
    const txnGroups = txns.map(txn => ({
      txn: algosdk.encodeUnsignedTransaction(txn),
      signers: [accountAddress],
    }));

    const signedTxns = await peraWallet.signTransaction([txnGroups]);
    return signedTxns;
  }, [peraWallet, accountAddress]);

  return (
    <WalletContext.Provider
      value={{
        peraWallet,
        accountAddress,
        connectWallet,
        disconnectWallet,
        signTransaction,
        isConnected: !!accountAddress,
        isVerifying,
        verifyWalletSession,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
