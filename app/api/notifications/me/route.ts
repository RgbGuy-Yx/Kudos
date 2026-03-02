import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyJWT } from '@/lib/auth';
import { NotificationDocument } from '@/lib/models/Notification';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access notifications' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');

    const notifications = await db
      .collection<NotificationDocument>('notifications')
      .find({ userWallet: payload.walletAddress })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      notifications: notifications.map((item) => ({
        id: item._id?.toString(),
        type: item.type,
        title: item.title,
        message: item.message,
        metadata: item.metadata,
        read: item.read,
        createdAt: item.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}
