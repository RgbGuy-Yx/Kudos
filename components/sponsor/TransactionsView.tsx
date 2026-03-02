'use client';

interface GrantTransaction {
  txId: string;
  type: string;
  createdAt: string | Date;
  amount?: number;
  milestoneIndex?: number;
}

interface TransactionsViewProps {
  transactions: GrantTransaction[];
}

export default function TransactionsView({ transactions }: TransactionsViewProps) {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Transactions</h2>
        <p className="mt-1 text-sm text-slate-400">On-chain transaction history and payout events.</p>
      </header>

      {!transactions.length ? (
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/55 p-4 text-sm text-slate-400">
          No transactions yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <div
              key={`${tx.txId}-${tx.createdAt}`}
              className="rounded-xl border border-slate-700/60 bg-slate-900/55 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{tx.type.replaceAll('_', ' ')}</p>
                <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {typeof tx.amount === 'number' && (
                  <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-200">
                    Amount: {tx.amount} ALGO
                  </span>
                )}
                {typeof tx.milestoneIndex === 'number' && (
                  <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-200">
                    Milestone: {tx.milestoneIndex + 1}
                  </span>
                )}
              </div>

              <p className="mt-3 break-all text-xs text-purple-300">{tx.txId}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
