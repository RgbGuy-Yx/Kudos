import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument } from '@/lib/models/Grant';

function normalizeTrustScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit proposals' }, { status: 403 });
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

    const now = new Date();
    const proposal: ProjectDocument = {
      title: String(title).trim(),
      description: String(description).trim(),
      abstract: String(description).trim(),
      expectedDeliverables: String(expectedDeliverables).trim(),
      expectedTimeline: String(expectedTimeline).trim(),
      expectedCost: parsedExpectedCost,
      proposedBudget: parsedExpectedCost,
      trustScore: normalizeTrustScore(70),
      studentWallet: payload.walletAddress,
      githubLink: String(githubLink).trim(),
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<ProjectDocument>('projects').insertOne(proposal);

    return NextResponse.json(
      {
        message: 'Proposal submitted successfully',
        projectId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Submit proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to submit proposal', details: error.message },
      { status: 500 }
    );
  }
}
