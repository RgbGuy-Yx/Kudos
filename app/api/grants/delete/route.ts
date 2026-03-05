import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument, ProjectDocument } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';

function clampTrustScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can delete grants' }, { status: 403 });
    }

    const { grantId, clawbackTxId } = await req.json();
    if (!grantId) {
      return NextResponse.json({ error: 'grantId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const grant = await db.collection<GrantDocument>('grants').findOne({
      _id: new ObjectId(grantId),
      sponsorWallet: payload.walletAddress,
      status: 'ACTIVE',
    });

    if (!grant) {
      return NextResponse.json({ error: 'Active grant not found' }, { status: 404 });
    }

    // Instead of deleting, mark the grant as CANCELLED and record the clawback
    const now = new Date();
    const grantUpdate: any = {
      $set: {
        status: 'CANCELLED',
        escrowBalance: 0,
        updatedAt: now,
      },
    };

    // Record the clawback transaction if a txId was provided (on-chain clawback was performed)
    if (clawbackTxId) {
      grantUpdate.$push = {
        transactions: {
          txId: clawbackTxId,
          type: 'EMERGENCY_CLAWBACK',
          createdAt: now,
          amount: grant.escrowBalance,
        },
      };
    }

    await db.collection<GrantDocument>('grants').updateOne(
      { _id: grant._id },
      grantUpdate
    );

    const linkedProject = await db.collection<ProjectDocument>('projects').findOne({ _id: grant.projectId });
    const currentScore = typeof linkedProject?.trustScore === 'number' ? linkedProject.trustScore : 70;
    const nextScore = clampTrustScore(currentScore - 10);

    await db.collection<ProjectDocument>('projects').updateOne(
      { _id: grant.projectId },
      {
        $set: {
          status: 'OPEN',
          trustScore: nextScore,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: 'Grant cancelled and escrow funds returned to sponsor' });
  } catch (error: any) {
    console.error('Delete grant error:', error);
    return NextResponse.json(
      { error: 'Failed to delete active grant', details: error.message },
      { status: 500 }
    );
  }
}
