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
    const { appId, milestoneIndex, proofLink, description } = body;

    // Validation
    if (!appId || milestoneIndex === undefined || !proofLink || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: appId, milestoneIndex, proofLink, description' },
        { status: 400 }
      );
    }

    if (typeof appId !== 'number' || appId <= 0) {
      return NextResponse.json({ error: 'Invalid appId' }, { status: 400 });
    }

    if (typeof milestoneIndex !== 'number' || milestoneIndex < 0) {
      return NextResponse.json({ error: 'Invalid milestoneIndex' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(proofLink);
    } catch {
      return NextResponse.json({ error: 'Invalid proofLink URL' }, { status: 400 });
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
      proofLink,
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
