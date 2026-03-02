import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { MilestoneSubmission } from '@/lib/models/Milestone';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    const milestonesCollection = db.collection<MilestoneSubmission>('milestones');

    // Build query based on role
    const query: any = { appId: parseInt(appId) };

    if (payload.role === 'student') {
      // Students can only see their own milestones
      query.studentAddress = payload.walletAddress;
    }
    // Sponsors can see all milestones for their app

    const milestones = await milestonesCollection
      .find(query)
      .sort({ milestoneIndex: 1 })
      .toArray();

    return NextResponse.json({ milestones });
  } catch (error: any) {
    console.error('Fetch milestones error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones', details: error.message },
      { status: 500 }
    );
  }
}
