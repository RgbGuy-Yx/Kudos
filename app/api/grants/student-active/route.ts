import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument } from '@/lib/models/Grant';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this endpoint' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const activeGrant = await db.collection<GrantDocument>('grants').findOne(
      {
        studentWallet: payload.walletAddress,
        status: 'ACTIVE',
      },
      { sort: { createdAt: -1 } }
    );

    const shouldShowCreationNotification = !!activeGrant && !activeGrant.creationNotifiedToStudent;

    if (activeGrant && !activeGrant.creationNotifiedToStudent && activeGrant._id) {
      await db.collection<GrantDocument>('grants').updateOne(
        { _id: activeGrant._id },
        {
          $set: {
            creationNotifiedToStudent: true,
            creationNotifiedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      hasActiveGrant: !!activeGrant,
      showCreationNotification: shouldShowCreationNotification,
      activeGrant: activeGrant
        ? {
            id: activeGrant._id?.toString(),
            appId: activeGrant.appId,
            sponsorWallet: activeGrant.sponsorWallet,
            projectTitle: activeGrant.projectTitle,
            proposedBudget: activeGrant.proposedBudget,
            milestoneIndex: activeGrant.milestoneIndex,
            totalMilestones: activeGrant.totalMilestones,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Fetch student active grant error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active grant', details: error.message },
      { status: 500 }
    );
  }
}
