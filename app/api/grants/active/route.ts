import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument, serializeGrant } from '@/lib/models/Grant';



export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can access grants' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const activeGrant = await db
      .collection<GrantDocument>('grants')
      .findOne({ sponsorWallet: payload.walletAddress, status: 'ACTIVE' }, { sort: { createdAt: -1 } });

    const now = new Date();
    const monthAnchors = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return d;
    });

    const completedStart = new Date(monthAnchors[0]);

    const completedGrants = await db
      .collection<GrantDocument>('grants')
      .find({
        sponsorWallet: payload.walletAddress,
        status: 'COMPLETED',
        completedAt: { $gte: completedStart },
      })
      .toArray();

    const completedGrantsCount = await db.collection<GrantDocument>('grants').countDocuments({
      sponsorWallet: payload.walletAddress,
      status: 'COMPLETED',
    });

    const trendByMonth = monthAnchors.map((anchor) => {
      const label = anchor.toLocaleString('en-US', { month: 'short' });
      const count = completedGrants.filter((grant) => {
        if (!grant.completedAt) return false;
        return (
          grant.completedAt.getFullYear() === anchor.getFullYear() &&
          grant.completedAt.getMonth() === anchor.getMonth()
        );
      }).length;

      return { label, count };
    });

    return NextResponse.json({
      activeGrant: activeGrant ? serializeGrant(activeGrant) : null,
      completedGrantsCount,
      completedGrantsTrend: trendByMonth,
    });
  } catch (error: any) {
    console.error('Fetch active grant error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active grant', details: error.message },
      { status: 500 }
    );
  }
}
