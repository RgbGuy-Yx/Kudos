import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { MilestoneSubmission } from '@/lib/models/Milestone';
import { GrantDocument, ProjectDocument } from '@/lib/models/Grant';
import { NotificationDocument } from '@/lib/models/Notification';
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
      return NextResponse.json({ error: 'Only sponsors can review milestones' }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, action, reason, txId } = body;

    if (!submissionId || !action) {
      return NextResponse.json({ error: 'submissionId and action are required' }, { status: 400 });
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const milestone = await db.collection<MilestoneSubmission>('milestones').findOne({
      _id: new ObjectId(submissionId),
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone submission not found' }, { status: 404 });
    }

    const grant = await db.collection<GrantDocument>('grants').findOne({
      appId: milestone.appId,
      sponsorWallet: payload.walletAddress,
      status: 'ACTIVE',
    });

    if (!grant) {
      return NextResponse.json({ error: 'Active grant not found for this milestone' }, { status: 404 });
    }

    // Enforce sequential milestone approval: only approve the current milestone in order
    if (action === 'APPROVE') {
      if (milestone.milestoneIndex !== grant.milestoneIndex) {
        return NextResponse.json(
          {
            error: `Cannot approve milestone ${milestone.milestoneIndex + 1} — milestone ${grant.milestoneIndex + 1} must be approved first`,
          },
          { status: 400 }
        );
      }

      // Prevent double-approval: milestone must be in pending/submitted state
      if (milestone.status !== 'pending') {
        return NextResponse.json(
          { error: `Milestone is already ${milestone.status}` },
          { status: 409 }
        );
      }
    }

    const now = new Date();

    await db.collection<MilestoneSubmission>('milestones').updateOne(
      { _id: milestone._id },
      {
        $set: {
          status: action === 'APPROVE' ? 'approved' : 'rejected',
          approvedAt: action === 'APPROVE' ? now : undefined,
          rejectedReason: action === 'REJECT' ? reason || 'Rejected by sponsor' : undefined,
          reviewTxId: txId || undefined,
        } as Partial<MilestoneSubmission>,
      }
    );

    if (action === 'APPROVE') {
      const milestonePayout = grant.totalMilestones > 0
        ? grant.proposedBudget / grant.totalMilestones
        : 0;
      const nextEscrowBalance = Math.max(0, Number(grant.escrowBalance || 0) - milestonePayout);
      const nextMilestoneIndex = Math.max(Number(grant.milestoneIndex || 0), milestone.milestoneIndex + 1);

      const grantUpdate: any = {
        $set: {
          milestoneIndex: nextMilestoneIndex,
          escrowBalance: nextEscrowBalance,
          updatedAt: now,
        },
      };

      if (txId) {
        grantUpdate.$push = {
          transactions: {
            txId,
            type: 'APPROVE_MILESTONE',
            createdAt: now,
            milestoneIndex: milestone.milestoneIndex,
            amount: milestonePayout,
          },
        };
      }

      await db.collection<GrantDocument>('grants').updateOne(
        { _id: grant._id },
        grantUpdate
      );
    }

    const project = await db.collection<ProjectDocument>('projects').findOne({ _id: grant.projectId });
    if (project) {
      const currentScore = typeof project.trustScore === 'number' ? project.trustScore : 70;
      const nextScore = action === 'APPROVE'
        ? clampTrustScore(currentScore + 5)
        : clampTrustScore(currentScore - 7);

      await db.collection<ProjectDocument>('projects').updateOne(
        { _id: project._id },
        {
          $set: {
            trustScore: nextScore,
            updatedAt: now,
          },
        }
      );
    }

    const milestoneNumber = milestone.milestoneIndex + 1;
    const notification: NotificationDocument = {
      userWallet: grant.studentWallet,
      type: action === 'APPROVE' ? 'MILESTONE_APPROVED' : 'MILESTONE_REJECTED',
      title: action === 'APPROVE' ? 'Milestone Approved' : 'Milestone Rejected',
      message:
        action === 'APPROVE'
          ? `Your Milestone ${milestoneNumber} has been approved and funds were released from escrow.`
          : `Your Milestone ${milestoneNumber} was rejected by the sponsor. Please update and resubmit.`,
      metadata: {
        appId: milestone.appId,
        milestoneIndex: milestone.milestoneIndex,
        submissionId: submissionId,
      },
      read: false,
      createdAt: now,
    };

    await db.collection<NotificationDocument>('notifications').insertOne(notification);

    return NextResponse.json({
      message: `Milestone ${action === 'APPROVE' ? 'approved' : 'rejected'}`,
    });
  } catch (error: any) {
    console.error('Review milestone error:', error);
    return NextResponse.json(
      { error: 'Failed to review milestone', details: error.message },
      { status: 500 }
    );
  }
}
