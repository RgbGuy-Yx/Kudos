import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument, ProjectDocument } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can complete grants' }, { status: 403 });
    }

    const { grantId } = await req.json();
    if (!grantId) {
      return NextResponse.json({ error: 'grantId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    const now = new Date();

    const grant = await db.collection<GrantDocument>('grants').findOne({
      _id: new ObjectId(grantId),
      sponsorWallet: payload.walletAddress,
      status: 'ACTIVE',
    });

    if (!grant) {
      return NextResponse.json({ error: 'Active grant not found' }, { status: 404 });
    }

    await db.collection<GrantDocument>('grants').updateOne(
      { _id: grant._id },
      {
        $set: {
          status: 'COMPLETED',
          milestoneIndex: grant.totalMilestones,
          escrowBalance: 0,
          completedAt: now,
          updatedAt: now,
        },
      }
    );

    await db.collection<ProjectDocument>('projects').updateOne(
      { _id: grant.projectId },
      { $set: { status: 'OPEN', updatedAt: now } }
    );

    return NextResponse.json({ message: 'Grant marked as completed' });
  } catch (error: any) {
    console.error('Complete grant error:', error);
    return NextResponse.json(
      { error: 'Failed to complete grant', details: error.message },
      { status: 500 }
    );
  }
}
