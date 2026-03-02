import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can view project details' }, { status: 403 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const project = await db.collection<ProjectDocument>('projects').findOne({
      _id: new ObjectId(id),
      status: 'OPEN',
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        id: project._id?.toString(),
        title: project.title,
        description: project.description,
        abstract: project.abstract || project.description,
        expectedDeliverables:
          project.expectedDeliverables ||
          'Project MVP delivery, source code documentation, and milestone-based progress updates.',
        expectedTimeline: project.expectedTimeline || '8 weeks',
        expectedCost: project.expectedCost ?? project.proposedBudget,
        trustScore: Math.max(0, Math.min(100, Math.round(project.trustScore ?? 70))),
        proposedBudget: project.proposedBudget,
        studentWallet: project.studentWallet,
        githubLink: project.githubLink,
        status: project.status,
      },
    });
  } catch (error: any) {
    console.error('Fetch project details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details', details: error.message },
      { status: 500 }
    );
  }
}
