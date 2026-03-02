import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument, ProjectDocument } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';

function serializeGrant(grant: GrantDocument) {
  return {
    id: grant._id?.toString(),
    sponsorWallet: grant.sponsorWallet,
    studentWallet: grant.studentWallet,
    projectId: grant.projectId.toString(),
    projectTitle: grant.projectTitle,
    description: grant.description,
    githubLink: grant.githubLink,
    proposedBudget: grant.proposedBudget,
    appId: grant.appId,
    status: grant.status,
    milestoneIndex: grant.milestoneIndex,
    totalMilestones: grant.totalMilestones,
    escrowBalance: grant.escrowBalance,
    transactions: grant.transactions,
    createdAt: grant.createdAt,
    updatedAt: grant.updatedAt,
    completedAt: grant.completedAt,
  };
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can create grants' }, { status: 403 });
    }

    const body = await req.json();
    const { projectId, studentWallet, proposedBudget, totalMilestones, appId, txId } = body;

    if (!projectId || !studentWallet || !proposedBudget || !totalMilestones || !appId || !txId) {
      return NextResponse.json(
        { error: 'projectId, studentWallet, proposedBudget, totalMilestones, appId and txId are required' },
        { status: 400 }
      );
    }

    const parsedMilestones = Number(totalMilestones);
    if (!Number.isInteger(parsedMilestones) || parsedMilestones <= 0) {
      return NextResponse.json(
        { error: 'totalMilestones must be a positive integer' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const existingActive = await db.collection<GrantDocument>('grants').findOne({
      sponsorWallet: payload.walletAddress,
      status: 'ACTIVE',
    });

    if (existingActive) {
      return NextResponse.json(
        { error: 'Sponsor can only have one active grant' },
        { status: 409 }
      );
    }

    const project = await db.collection<ProjectDocument>('projects').findOne({
      _id: new ObjectId(projectId),
      status: 'OPEN',
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or not open' },
        { status: 404 }
      );
    }

    const now = new Date();
    const grant: GrantDocument = {
      sponsorWallet: payload.walletAddress,
      studentWallet,
      projectId: project._id as ObjectId,
      projectTitle: project.title,
      description: project.description,
      githubLink: project.githubLink,
      proposedBudget: Number(proposedBudget),
      appId: Number(appId),
      status: 'ACTIVE',
      milestoneIndex: 0,
      totalMilestones: parsedMilestones,
      escrowBalance: Number(proposedBudget),
      transactions: [
        {
          txId,
          type: 'CREATE_GRANT',
          createdAt: now,
          amount: Number(proposedBudget),
        },
      ],
      creationNotifiedToStudent: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<GrantDocument>('grants').insertOne(grant);

    await db.collection<ProjectDocument>('projects').updateOne(
      { _id: project._id },
      { $set: { status: 'IN_GRANT', updatedAt: now } }
    );

    return NextResponse.json(
      {
        message: 'Grant created successfully',
        grant: serializeGrant({ ...grant, _id: result.insertedId }),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create grant error:', error);
    return NextResponse.json(
      { error: 'Failed to create grant', details: error.message },
      { status: 500 }
    );
  }
}
