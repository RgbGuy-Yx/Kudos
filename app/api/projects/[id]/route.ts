import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument, ProposalData } from '@/lib/models/Grant';
import { ObjectId } from 'mongodb';

function extractSection(text: string, startLabel: string, endLabel?: string): string {
  const escapedStart = startLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startRegex = new RegExp(`${escapedStart}\\s*:?\\s*`, 'i');
  const startMatch = text.match(startRegex);
  if (!startMatch || startMatch.index === undefined) return '';

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = text.slice(startIndex);

  if (!endLabel) return rest.trim();

  const escapedEnd = endLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const endRegex = new RegExp(`\\s+${escapedEnd}\\s*:?\\s*`, 'i');
  const endMatch = rest.match(endRegex);
  if (!endMatch || endMatch.index === undefined) return rest.trim();

  return rest.slice(0, endMatch.index).trim();
}

function parseLegacyProposalData(project: ProjectDocument): ProposalData {
  if (project.proposalData) return project.proposalData;

  const description = project.description || '';
  const hasLegacyPattern = /Deliverables:|Tech Stack:|Stage:|Category:|Timeline:|Funds Usage:/i.test(
    description,
  );

  if (!hasLegacyPattern) {
    return {
      funding: {
        expectedTimeline: project.expectedTimeline || '',
        expectedCost: project.expectedCost ?? project.proposedBudget,
        milestones: [],
      },
      project: {
        shortDescription: description,
      },
    };
  }

  const shortDescription = description.split(/\n\nDeliverables:/i)[0]?.trim() || description;
  const deliverables = extractSection(description, 'Deliverables', 'Tech Stack');
  const techStackRaw = extractSection(description, 'Tech Stack', 'Stage');
  const stage = extractSection(description, 'Stage', 'Category');
  const category = extractSection(description, 'Category', 'Timeline');
  const timeline = extractSection(description, 'Timeline', 'Funds Usage');
  const fundsUsage = extractSection(description, 'Funds Usage');

  return {
    project: {
      shortDescription,
      category,
      stage,
      techStack: techStackRaw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => item.toLowerCase() !== 'n/a'),
    },
    funding: {
      expectedTimeline: timeline || project.expectedTimeline || '',
      expectedCost: project.expectedCost ?? project.proposedBudget,
      fundsUsage,
      milestones: [],
    },
    aboutYou: {},
  };
}

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

    const normalizedProposalData = parseLegacyProposalData(project);

    return NextResponse.json({
      project: {
        id: project._id?.toString(),
        title: project.title,
        description: project.description,
        abstract: project.abstract || normalizedProposalData.project?.shortDescription || project.description,
        expectedDeliverables:
          project.expectedDeliverables ||
          extractSection(project.description || '', 'Deliverables', 'Tech Stack') ||
          'Project MVP delivery, source code documentation, and milestone-based progress updates.',
        expectedTimeline:
          project.expectedTimeline || normalizedProposalData.funding?.expectedTimeline || '8 weeks',
        expectedCost: project.expectedCost ?? project.proposedBudget,
        trustScore: Math.max(0, Math.min(100, Math.round(project.trustScore ?? 70))),
        proposedBudget: project.proposedBudget,
        studentWallet: project.studentWallet,
        githubLink: project.githubLink,
        proposalData: normalizedProposalData,
        milestones: normalizedProposalData.funding?.milestones || [],
        status: project.status,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fetch project details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details', details: message },
      { status: 500 }
    );
  }
}
