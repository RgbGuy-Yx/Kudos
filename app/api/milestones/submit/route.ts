import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { MilestoneSubmission } from '@/lib/models/Milestone';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit milestones' }, { status: 403 });
    }

    const body = await req.json();
    const {
      appId,
      milestoneIndex,
      proofLink,
      proofFileUrl,
      proofFileName,
      proofFileMimeType,
      description,
    } = body;

    // Validation
    if (!appId || milestoneIndex === undefined || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: appId, milestoneIndex, description' },
        { status: 400 }
      );
    }

    if (!proofLink && !proofFileUrl) {
      return NextResponse.json(
        { error: 'Provide either a proofLink or an uploaded proof file URL' },
        { status: 400 }
      );
    }

    if (typeof appId !== 'number' || appId <= 0) {
      return NextResponse.json({ error: 'Invalid appId' }, { status: 400 });
    }

    if (typeof milestoneIndex !== 'number' || milestoneIndex < 0) {
      return NextResponse.json({ error: 'Invalid milestoneIndex' }, { status: 400 });
    }

    if (proofLink) {
      try {
        new URL(proofLink);
      } catch {
        return NextResponse.json({ error: 'Invalid proofLink URL' }, { status: 400 });
      }
    }

    if (proofFileUrl && typeof proofFileUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid proofFileUrl' }, { status: 400 });
    }

    if (proofFileUrl && !proofFileUrl.startsWith('/uploads/milestones/')) {
      return NextResponse.json({ error: 'Invalid uploaded proof file URL' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    const milestonesCollection = db.collection<MilestoneSubmission>('milestones');

    // Check if milestone already submitted
    const existing = await milestonesCollection.findOne({
      appId,
      milestoneIndex,
    });

    if (existing) {
      // Allow resubmission if the previous submission was rejected
      if (existing.status === 'rejected') {
        await milestonesCollection.updateOne(
          { _id: existing._id },
          {
            $set: {
              proofType: proofFileUrl ? 'file_upload' : 'github_link',
              proofLink: proofLink || undefined,
              proofFileUrl: proofFileUrl || undefined,
              proofFileName: proofFileName || undefined,
              proofFileMimeType: proofFileMimeType || undefined,
              description,
              submittedAt: new Date(),
              status: 'pending',
              rejectedReason: undefined,
            } as Partial<MilestoneSubmission>,
          }
        );

        return NextResponse.json({
          message: 'Milestone resubmitted successfully',
          milestoneId: existing._id,
        });
      }

      return NextResponse.json(
        { error: 'Milestone already submitted', milestone: existing },
        { status: 409 }
      );
    }

    // Create milestone submission
    const milestone: MilestoneSubmission = {
      appId,
      milestoneIndex,
      studentAddress: payload.walletAddress,
      proofType: proofFileUrl ? 'file_upload' : 'github_link',
      proofLink: proofLink || undefined,
      proofFileUrl: proofFileUrl || undefined,
      proofFileName: proofFileName || undefined,
      proofFileMimeType: proofFileMimeType || undefined,
      description,
      submittedAt: new Date(),
      status: 'pending',
    };

    const result = await milestonesCollection.insertOne(milestone);

    return NextResponse.json({
      message: 'Milestone submitted successfully',
      milestoneId: result.insertedId,
      milestone,
    });
  } catch (error: any) {
    console.error('Submit milestone error:', error);
    return NextResponse.json(
      { error: 'Failed to submit milestone', details: error.message },
      { status: 500 }
    );
  }
}
