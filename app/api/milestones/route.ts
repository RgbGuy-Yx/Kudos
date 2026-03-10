import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { MilestoneSubmission } from '@/lib/models/Milestone';
import { GrantDocument } from '@/lib/models/Grant';

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
    const parsedAppId = parseInt(appId);
    const query: any = { appId: parsedAppId };

    if (payload.role === 'student') {
      // Students can only see their own milestones
      query.studentAddress = payload.walletAddress;
    } else if (payload.role === 'sponsor') {
      // Verify the sponsor actually owns a grant with this appId
      const grant = await db.collection<GrantDocument>('grants').findOne({
        appId: parsedAppId,
        sponsorWallet: payload.walletAddress,
      });
      if (!grant) {
        return NextResponse.json({ error: 'Grant not found for this app ID' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
