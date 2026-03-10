'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DevLogin() {
  const router = useRouter();
  const [wallet, setWallet] = useState('TESTWALLETSTUUUUUUUUUUUUUUUUUUUUU');
  
  const login = async (role: string) => {
    await fetch('/api/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, walletAddress: wallet })
    });
    router.push(role === 'sponsor' ? '/sponsor/dashboard' : '/dashboard/student');
  };

  return (
    <div className="p-10 space-y-4 text-black bg-white min-h-screen">
      <h1 className="text-2xl font-bold">QA Automation Entry</h1>
      <input 
        value={wallet} 
        onChange={e => setWallet(e.target.value)}
        className="border p-2 w-full text-black"
      />
      <div className="flex gap-4">
        <button id="login-student" onClick={() => login('student')} className="bg-blue-500 text-white p-2 rounded">Login as Student</button>
        <button id="login-sponsor" onClick={() => login('sponsor')} className="bg-green-500 text-white p-2 rounded">Login as Sponsor</button>
      </div>
    </div>
  );
}
