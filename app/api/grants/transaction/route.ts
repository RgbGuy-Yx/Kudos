import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument, GrantTransaction } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can update grant transactions' }, { status: 403 });
    }

    const { grantId, txId, type, amount, milestoneIndex, escrowBalance, currentMilestone } = await req.json();

    if (!grantId || !txId || !type) {
      return NextResponse.json({ error: 'grantId, txId and type are required' }, { status: 400 });
    }

    const ALLOWED_TX_TYPES = ['CREATE_GRANT', 'FUND_ESCROW', 'APPROVE_MILESTONE', 'EMERGENCY_CLAWBACK'] as const;
    if (!ALLOWED_TX_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    const transaction: GrantTransaction = {
      txId,
      type,
      createdAt: new Date(),
      amount,
      milestoneIndex,
    };

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const result = await db.collection<GrantDocument>('grants').updateOne(
      {
        _id: new ObjectId(grantId),
        sponsorWallet: payload.walletAddress,
      },
      {
        $push: { transactions: transaction },
        $set: {
          updatedAt: new Date(),
          ...(typeof escrowBalance === 'number' ? { escrowBalance } : {}),
          ...(typeof currentMilestone === 'number' ? { milestoneIndex: currentMilestone } : {}),
        },
      }
    );

    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction recorded' });
  } catch (error: any) {
    console.error('Grant transaction update error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error.message },
      { status: 500 }
    );
  }
}
