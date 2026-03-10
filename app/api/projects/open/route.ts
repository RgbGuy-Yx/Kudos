import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { ProjectDocument } from '@/lib/models/Grant';
import algosdk from 'algosdk';

function generateValidWalletAddress(): string {
  return String(algosdk.generateAccount().addr);
}

function clampTrustScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function fallbackTrustScore(title: string): number {
  const sum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return clampTrustScore(60 + (sum % 36));
}

function createMockOpenProjects(): Omit<ProjectDocument, '_id'>[] {
  return [
    {
      title: 'AI Study Planner for Underserved Students',
      description:
        'Adaptive planner that builds weekly schedules from course load, deadlines, and available hours.',
      abstract:
        'This project builds a scheduling assistant for low-resource learners. It combines assignment deadlines, exam dates, and student availability to generate weekly plans with priority scoring and missed-task recovery suggestions. The deliverable includes a dashboard, reminder workflow, and measurable retention metrics.',
      expectedDeliverables:
        'Web dashboard, schedule recommendation engine, reminder workflow, and sponsor progress report module.',
      expectedTimeline: '8 weeks',
      expectedCost: 120,
      trustScore: 82,
      proposedBudget: 120,
      studentWallet: generateValidWalletAddress(),
      githubLink: 'https://github.com/trustfundx/mock-ai-study-planner',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'On-Chain Attendance Verification Tool',
      description:
        'A lightweight attendance tracker that signs class presence and anchors hashes to Algorand TestNet.',
      abstract:
        'This tool verifies student attendance with signed records and tamper-evident storage. Lecturers can upload attendance batches and the system anchors verification hashes to Algorand TestNet for public validation. The MVP includes role-based dashboards, CSV import, and audit export for institutions.',
      expectedDeliverables:
        'Attendance capture UI, signed proof pipeline, hash anchoring utility, and CSV audit export.',
      expectedTimeline: '6 weeks',
      expectedCost: 95,
      trustScore: 74,
      proposedBudget: 95,
      studentWallet: generateValidWalletAddress(),
      githubLink: 'https://github.com/trustfundx/mock-attendance-verifier',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'Career Mentorship Matching Platform',
      description:
        'Matches students with mentors based on goals, skills, and availability, with progress check-ins.',
      abstract:
        'The platform matches students to mentors using a compatibility model for skills, domain interests, and time slots. It includes session planning, goal tracking, and structured check-ins with milestone analytics. Grant funding supports a production-ready matching engine and feedback loop.',
      expectedDeliverables:
        'Mentor matching engine, session scheduling dashboard, check-in tracker, and analytics panel.',
      expectedTimeline: '10 weeks',
      expectedCost: 150,
      trustScore: 91,
      proposedBudget: 150,
      studentWallet: generateValidWalletAddress(),
      githubLink: 'https://github.com/trustfundx/mock-mentorship-match',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can view projects' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    const projectsCollection = db.collection<ProjectDocument>('projects');

    let projects = await projectsCollection
      .find({ status: 'OPEN' })
      .sort({ createdAt: -1 })
      .toArray();

    // Filter out projects with invalid wallets instead of silently replacing them
    projects = projects.filter(
      (project) => !!project.studentWallet && algosdk.isValidAddress(project.studentWallet)
    );

    // Backfill missing trust scores (non-destructive)
    const missingTrustScoreProjects = projects.filter((project) => typeof project.trustScore !== 'number');
    if (missingTrustScoreProjects.length > 0) {
      await Promise.all(
        missingTrustScoreProjects.map((project) =>
          projectsCollection.updateOne(
            { _id: project._id },
            {
              $set: {
                trustScore: fallbackTrustScore(project.title),
                updatedAt: new Date(),
              },
            }
          )
        )
      );

      projects = await projectsCollection
        .find({ status: 'OPEN' })
        .sort({ createdAt: -1 })
        .toArray();

      projects = projects.filter(
        (project) => !!project.studentWallet && algosdk.isValidAddress(project.studentWallet)
      );
    }

    // Only insert mock data in development — never in production
    if (projects.length === 0 && process.env.NODE_ENV === 'development') {
      await projectsCollection.insertMany(createMockOpenProjects());
      projects = await projectsCollection
        .find({ status: 'OPEN' })
        .sort({ createdAt: -1 })
        .toArray();
    }

    return NextResponse.json({
      projects: projects
        .filter((project) => !!project._id)
        .map((project) => ({
          id: project._id!.toString(),
          title: project.title,
          description: project.description,
          abstract: project.abstract,
          expectedDeliverables: project.expectedDeliverables,
          expectedTimeline: project.expectedTimeline,
          expectedCost: project.expectedCost,
          trustScore: clampTrustScore(
            typeof project.trustScore === 'number' ? project.trustScore : fallbackTrustScore(project.title)
          ),
          proposedBudget: project.proposedBudget,
          studentWallet: project.studentWallet,
          githubLink: project.githubLink,
          status: project.status,
        })),
    });
  } catch (error: any) {
    console.error('Fetch open projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch open projects', details: error.message },
      { status: 500 }
    );
  }
}
