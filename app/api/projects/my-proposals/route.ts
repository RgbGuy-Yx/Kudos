import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument } from '@/lib/models/Grant';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view submitted proposals' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const projects = await db
      .collection<ProjectDocument>('projects')
      .find({ studentWallet: payload.walletAddress })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      proposals: projects
        .filter((project) => !!project._id)
        .map((project) => ({
          id: project._id!.toString(),
          title: project.title,
          description: project.description,
          abstract: project.abstract,
          expectedDeliverables: project.expectedDeliverables,
          expectedTimeline: project.expectedTimeline,
          expectedCost: project.expectedCost,
          trustScore: project.trustScore,
          proposedBudget: project.proposedBudget,
          studentWallet: project.studentWallet,
          githubLink: project.githubLink,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })),
    });
  } catch (error: any) {
    console.error('Fetch my proposals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submitted proposals', details: error.message },
      { status: 500 }
    );
  }
}
