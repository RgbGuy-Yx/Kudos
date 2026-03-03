'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/contexts/WalletContext';
import { algoToMicroalgos, createApplication, fundContract } from '@/lib/algorand';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  abstract: string;
  expectedDeliverables: string;
  expectedTimeline: string;
  expectedCost: number;
  trustScore: number;
  proposedBudget: number;
  studentWallet: string;
  githubLink: string;
  status: string;
}

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { accountAddress, signTransaction, isConnected } = useWallet();

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [grantForm, setGrantForm] = useState({
    studentWallet: '',
    totalAmount: '',
    milestonesRequired: '',
  });
  const [grantFormError, setGrantFormError] = useState('');

  const clearFlashLater = useCallback(() => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 4000);
  }, []);

  const loadProject = useCallback(async () => {
    if (!params?.id) return;

    setPageLoading(true);
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load project details');
      }

      setProject(data.project);
      setGrantForm({
        studentWallet: data.project.studentWallet,
        totalAmount: String(data.project.expectedCost ?? data.project.proposedBudget),
        milestonesRequired: '3',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
      clearFlashLater();
    } finally {
      setPageLoading(false);
    }
  }, [clearFlashLater, params?.id]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user && user.role !== 'sponsor') {
      router.push('/dashboard/student');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user?.role === 'sponsor') {
      loadProject();
    }
  }, [loadProject, loading, user]);

  const handleCreateGrant = async () => {
    if (!project) return;

    if (!accountAddress || !isConnected) {
      setError('Connect wallet to create a grant');
      clearFlashLater();
      return;
    }

    const studentWallet = grantForm.studentWallet.trim();
    const totalAmount = Number(grantForm.totalAmount);
    const milestonesRequired = Number(grantForm.milestonesRequired);

    if (!studentWallet || !grantForm.totalAmount || !grantForm.milestonesRequired) {
      setGrantFormError('All three fields are required.');
      return;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setGrantFormError('Total amount must be greater than 0.');
      return;
    }

    if (!Number.isInteger(milestonesRequired) || milestonesRequired <= 0) {
      setGrantFormError('Milestone required must be a positive whole number.');
      return;
    }

    setGrantFormError('');
    setCreating(true);

    try {
      if (!accountAddress) {
        throw new Error('Please connect your wallet first');
      }

      // Step 1: Create the escrow contract application
      const { txId, appId } = await createApplication(
        accountAddress,
        studentWallet,
        algoToMicroalgos(totalAmount),
        milestonesRequired,
        signTransaction
      );

      // Step 2: Fund the escrow with the full grant amount
      const fundTxId = await fundContract(
        accountAddress,
        appId,
        algoToMicroalgos(totalAmount),
        signTransaction
      );

      const response = await fetch('/api/grants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          studentWallet,
          proposedBudget: totalAmount,
          totalMilestones: milestonesRequired,
          appId,
          txId,
          fundTxId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create grant');
      }

      setSuccess('Grant created successfully');
      setShowCreateModal(false);
      clearFlashLater();
      router.push('/sponsor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create grant');
      clearFlashLater();
    } finally {
      setCreating(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        Loading project details...
      </div>
    );
  }

  if (!user || user.role !== 'sponsor' || !project) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push('/sponsor/dashboard')}
          className="mb-4 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Back to Marketplace
        </button>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-800 bg-rose-900/30 p-3 text-sm text-rose-200">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-900/30 p-3 text-sm text-emerald-200">{success}</div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-3xl font-semibold text-white">{project.title}</h1>

          <div className="mt-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-300">Project Description</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">{project.description}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-300">Detailed Abstract</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">{project.abstract}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-300">Expected Deliveribles</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">{project.expectedDeliverables}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs text-slate-400">Expected Timeline</p>
                <p className="mt-1 text-sm text-slate-100">{project.expectedTimeline}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs text-slate-400">Expected Cost</p>
                <p className="mt-1 text-sm text-slate-100">{project.expectedCost} ALGO</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 md:col-span-2">
                <p className="text-xs text-slate-400">Trust Score</p>
                <p className="mt-1 text-sm text-slate-100">{project.trustScore}/100</p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-300">GitHub Link</h2>
              <a href={project.githubLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-sky-400 hover:text-sky-300">
                {project.githubLink}
              </a>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-7 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Create Grant
          </button>
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Create Grant</h3>
            <p className="mt-1 text-sm text-slate-400">Provide all required parameters to continue.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Student wallet address</label>
                <input
                  value={grantForm.studentWallet}
                  onChange={(event) => setGrantForm((prev) => ({ ...prev, studentWallet: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Enter student wallet address"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">Total amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={grantForm.totalAmount}
                  onChange={(event) => setGrantForm((prev) => ({ ...prev, totalAmount: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Enter total amount"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">Milestone required</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={grantForm.milestonesRequired}
                  onChange={(event) => setGrantForm((prev) => ({ ...prev, milestonesRequired: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Enter number of milestones"
                />
              </div>
            </div>

            {grantFormError && (
              <div className="mt-3 rounded-lg border border-rose-800 bg-rose-900/30 p-2 text-xs text-rose-200">
                {grantFormError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGrant}
                disabled={creating}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:bg-slate-700"
              >
                {creating ? 'Creating...' : 'Create Grant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
