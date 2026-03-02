'use client';

import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  description: string;
  abstract?: string;
  trustScore?: number;
  proposedBudget: number;
  studentWallet: string;
  githubLink: string;
  status: string;
}

interface MarketplaceViewProps {
  projects: Project[];
  loading: boolean;
  error: string;
  hasActiveGrant: boolean;
}

export default function MarketplaceView({
  projects,
  loading,
  error,
  hasActiveGrant,
}: MarketplaceViewProps) {
  const router = useRouter();

  const getCardPreview = (project: Project): string => {
    const content = project.abstract?.trim() || project.description;
    if (content.length <= 150) return content;
    return `${content.slice(0, 150)}...`;
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Project Marketplace</h2>
        <p className="mt-1 text-sm text-slate-400">Available open projects for funding.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-800 bg-rose-900/30 p-3 text-sm text-rose-200">{error}</div>
      )}

      {hasActiveGrant && (
        <div className="rounded-lg border border-amber-700/70 bg-amber-900/20 p-3 text-sm text-amber-200">
          You already have an active grant. Complete it before creating a new one.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-4 text-sm text-slate-400">
          No open projects found.
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-5 transition hover:border-purple-500/45"
            >
              <div className="flex h-full flex-col gap-3">
                <div className="inline-flex w-fit rounded-full border border-purple-500/35 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-200">
                  OPEN
                </div>

                <h3 className="text-2xl font-semibold leading-tight tracking-tight text-slate-100">{project.title}</h3>

                <p className="text-sm leading-6 text-slate-300">{getCardPreview(project)}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Budget</p>
                    <p className="mt-1 text-xl font-semibold text-slate-100">{project.proposedBudget} ALGO</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Trust Score</p>
                    <p className="mt-1 text-xl font-semibold text-slate-100">{project.trustScore ?? 70}/100</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/sponsor/projects/${project.id}`)}
                  className="mt-1 block w-full rounded-lg bg-purple-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  View project
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
