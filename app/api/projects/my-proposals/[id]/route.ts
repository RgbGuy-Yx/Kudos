import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument } from '@/lib/models/Grant';

function normalizeTrustScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can edit proposals' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid proposal ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      expectedDeliverables,
      expectedTimeline,
      expectedCost,
      githubLink,
    } = body;

    if (!title || !description || !expectedDeliverables || !expectedTimeline || !expectedCost || !githubLink) {
      return NextResponse.json(
        { error: 'All proposal fields are required' },
        { status: 400 }
      );
    }

    const parsedExpectedCost = Number(expectedCost);
    if (!Number.isFinite(parsedExpectedCost) || parsedExpectedCost <= 0) {
      return NextResponse.json(
        { error: 'Expected cost must be greater than 0' },
        { status: 400 }
      );
    }

    try {
      new URL(githubLink);
    } catch {
      return NextResponse.json({ error: 'Invalid GitHub link URL' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    const projectsCollection = db.collection<ProjectDocument>('projects');

    const existingProposal = await projectsCollection.findOne({
      _id: new ObjectId(id),
      studentWallet: payload.walletAddress,
    });

    if (!existingProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    await projectsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: String(title).trim(),
          description: String(description).trim(),
          abstract: String(description).trim(),
          expectedDeliverables: String(expectedDeliverables).trim(),
          expectedTimeline: String(expectedTimeline).trim(),
          expectedCost: parsedExpectedCost,
          proposedBudget: parsedExpectedCost,
          githubLink: String(githubLink).trim(),
          trustScore: normalizeTrustScore(
            typeof existingProposal.trustScore === 'number' ? existingProposal.trustScore : 70
          ),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: 'Proposal updated successfully' });
  } catch (error: any) {
    console.error('Update proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal', details: error.message },
      { status: 500 }
    );
  }
}
