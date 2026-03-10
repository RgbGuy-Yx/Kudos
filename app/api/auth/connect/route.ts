import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { signJWT, setAuthCookie } from '@/lib/auth';
import { UserDocument } from '@/lib/models/User';

/**
 * POST /api/auth/connect
 * Check if wallet exists in database
 * If exists: return user + JWT token
 * If not: return needsRoleSelection: true
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    
    // Check if user exists
    const user = await db.collection<UserDocument>('users').findOne({ 
      walletAddress 
    });

    if (!user) {
      // User doesn't exist, needs role selection
      return NextResponse.json({
        needsRoleSelection: true,
        walletAddress,
      });
    }

    // User exists, generate JWT token
    const token = await signJWT({
      walletAddress: user.walletAddress,
      role: user.role,
      userId: user._id!.toString(),
    });

    const response = NextResponse.json({
      needsRoleSelection: false,
      user: {
        id: user._id!.toString(),
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name,
        email: user.email,
        organization: user.organization,
      },
    });

    // Set HTTP-only cookie
    response.headers.set('Set-Cookie', setAuthCookie(token));

    return response;
  } catch (error) {
    console.error('Connect wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
