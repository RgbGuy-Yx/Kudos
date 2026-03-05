import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument, ProposalData, ProposalMilestone } from '@/lib/models/Grant';

function normalizeTrustScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sanitizeMilestones(input: unknown): ProposalMilestone[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as { title?: unknown; amount?: unknown; targetDate?: unknown };
      const amount = Number(candidate.amount);
      if (typeof candidate.title !== 'string' || !candidate.title.trim()) return null;
      if (!Number.isFinite(amount) || amount <= 0) return null;
      return {
        title: candidate.title.trim(),
        amount,
        targetDate: typeof candidate.targetDate === 'string' ? candidate.targetDate : '',
      };
    })
    .filter((item): item is ProposalMilestone => !!item);
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildDetailedAbstract(title: string, description: string, proposalData?: ProposalData): string {
  const aboutYou = proposalData?.aboutYou;
  const project = proposalData?.project;
  const funding = proposalData?.funding;
  const milestones = funding?.milestones || [];

  const intro = description || 'The student submitted this project proposal for sponsor review.';
  const profile = [aboutYou?.fullName, aboutYou?.degreeProgram, aboutYou?.university]
    .filter(Boolean)
    .join(' • ');
  const techStack = project?.techStack?.length ? project.techStack.join(', ') : 'N/A';
  const milestonePreview =
    milestones.length > 0
      ? milestones.map((m, index) => `M${index + 1}: ${m.title} (${m.amount} ALGO)`).join('; ')
      : 'Milestones not specified.';

  return [
    intro,
    profile ? `Student Profile: ${profile}.` : '',
    project?.category ? `Category: ${project.category}.` : '',
    project?.stage ? `Current Stage: ${project.stage}.` : '',
    `Tech Stack: ${techStack}.`,
    funding?.expectedTimeline ? `Timeline: ${funding.expectedTimeline}.` : '',
    funding?.fundsUsage ? `Funds Usage Plan: ${funding.fundsUsage}.` : '',
    `Milestone Plan: ${milestonePreview}`,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || `Project ${title} submitted for sponsor review.`;
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
      proposalData,
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

    const parsedProposalData: ProposalData = {
      aboutYou:
        proposalData && typeof proposalData === 'object' && proposalData.aboutYou && typeof proposalData.aboutYou === 'object'
          ? {
              fullName: asTrimmedString(proposalData.aboutYou.fullName),
              email: asTrimmedString(proposalData.aboutYou.email),
              university: asTrimmedString(proposalData.aboutYou.university),
              degreeProgram: asTrimmedString(proposalData.aboutYou.degreeProgram),
              yearOfStudy: asTrimmedString(proposalData.aboutYou.yearOfStudy),
              currentSemester: asTrimmedString(proposalData.aboutYou.currentSemester),
              graduationYear: asTrimmedString(proposalData.aboutYou.graduationYear),
              githubProfile: asTrimmedString(proposalData.aboutYou.githubProfile),
              linkedinUrl: asTrimmedString(proposalData.aboutYou.linkedinUrl),
            }
          : undefined,
      project:
        proposalData && typeof proposalData === 'object' && proposalData.project && typeof proposalData.project === 'object'
          ? {
              category: asTrimmedString(proposalData.project.category),
              stage: asTrimmedString(proposalData.project.stage),
              techStack: Array.isArray(proposalData.project.techStack)
                ? proposalData.project.techStack
                    .filter((item: unknown): item is string => typeof item === 'string')
                    .map((item: string) => item.trim())
                    .filter(Boolean)
                : [],
              githubRepoUrl: asTrimmedString(proposalData.project.githubRepoUrl),
              shortDescription: asTrimmedString(proposalData.project.shortDescription),
            }
          : undefined,
      funding:
        proposalData && typeof proposalData === 'object' && proposalData.funding && typeof proposalData.funding === 'object'
          ? {
              expectedTimeline: asTrimmedString(proposalData.funding.expectedTimeline) || String(expectedTimeline).trim(),
              expectedCost: Number.isFinite(Number(proposalData.funding.expectedCost))
                ? Number(proposalData.funding.expectedCost)
                : parsedExpectedCost,
              fundsUsage: asTrimmedString(proposalData.funding.fundsUsage),
              milestones: sanitizeMilestones(proposalData.funding.milestones),
            }
          : {
              expectedTimeline: String(expectedTimeline).trim(),
              expectedCost: parsedExpectedCost,
              milestones: [],
            },
    };

    const abstract = buildDetailedAbstract(String(title).trim(), String(description).trim(), parsedProposalData);

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const now = new Date();
    const proposal: ProjectDocument = {
      title: String(title).trim(),
      description: String(description).trim(),
      abstract,
      expectedDeliverables: String(expectedDeliverables).trim(),
      expectedTimeline: String(expectedTimeline).trim(),
      expectedCost: parsedExpectedCost,
      proposedBudget: parsedExpectedCost,
      trustScore: normalizeTrustScore(70),
      studentWallet: payload.walletAddress,
      githubLink: String(githubLink).trim(),
      proposalData: parsedProposalData,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Submit proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to submit proposal', details: message },
      { status: 500 }
    );
  }
}
