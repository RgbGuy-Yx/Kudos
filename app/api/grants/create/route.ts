import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { GrantDocument, ProjectDocument, serializeGrant } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';
import { verifyAppOnChain, getContractGlobalState, microalgosToAlgo } from '@/lib/algorand';



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
    const { projectId, studentWallet, proposedBudget, appId, txId, fundTxId } = body;

    if (!projectId || !studentWallet || !proposedBudget || !appId || !txId) {
      return NextResponse.json(
        { error: 'projectId, studentWallet, proposedBudget, appId and txId are required' },
        { status: 400 }
      );
    }

    // Reject demo/fake appIds on the server
    const parsedAppId = Number(appId);
    if (parsedAppId >= 900000000) {
      return NextResponse.json(
        { error: 'Demo application IDs cannot be used to create real grants' },
        { status: 400 }
      );
    }

    // Verify the on-chain application exists and sponsor matches the authenticated user
    const verification = await verifyAppOnChain(parsedAppId, payload.walletAddress);
    if (!verification.valid) {
      return NextResponse.json(
        { error: `On-chain verification failed: ${verification.error}` },
        { status: 400 }
      );
    }

    const contractState = await getContractGlobalState(parsedAppId);
    if (!contractState) {
      return NextResponse.json({ error: 'Failed to read contract state' }, { status: 400 });
    }
    
    const verifiedBudget = Number(microalgosToAlgo(contractState.escrowBalance));
    if (verifiedBudget < Number(proposedBudget)) {
      return NextResponse.json(
        { error: `On-chain escrow balance (${verifiedBudget} ALGO) is less than proposed budget (${proposedBudget} ALGO)` },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    // Idempotency: if a grant with this appId already exists, return it (handles retry after partial failure)
    const existingByAppId = await db.collection<GrantDocument>('grants').findOne({ appId: parsedAppId });
    if (existingByAppId) {
      return NextResponse.json(
        { message: 'Grant already exists for this application', grant: serializeGrant(existingByAppId) },
        { status: 200 }
      );
    }

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

    const derivedMilestones = project.proposalData?.funding?.milestones?.length || 3;
    const parsedMilestones = Number.isInteger(derivedMilestones) && derivedMilestones > 0
      ? derivedMilestones
      : 3;

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
        ...(fundTxId
          ? [
              {
                txId: fundTxId,
                type: 'FUND_ESCROW' as const,
                createdAt: now,
                amount: Number(proposedBudget),
              },
            ]
          : []),
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
