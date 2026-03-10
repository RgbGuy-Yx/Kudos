import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { signJWT, setAuthCookie } from '@/lib/auth';
import { UserDocument } from '@/lib/models/User';
import { UserRole } from '@/lib/types';

/**
 * POST /api/auth/register
 * Register new user with role after wallet connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, role, name, email, organization } = body;

    if (!walletAddress || !role) {
      return NextResponse.json(
        { error: 'Wallet address and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'student' && role !== 'sponsor') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "student" or "sponsor"' },
        { status: 400 }
      );
    }

    // Input length validation
    if (typeof walletAddress !== 'string' || walletAddress.length > 120) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    if (name && (typeof name !== 'string' || name.length > 200)) {
      return NextResponse.json({ error: 'Name must be 200 characters or less' }, { status: 400 });
    }
    if (email && (typeof email !== 'string' || email.length > 320)) {
      return NextResponse.json({ error: 'Email must be 320 characters or less' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (organization && (typeof organization !== 'string' || organization.length > 300)) {
      return NextResponse.json({ error: 'Organization must be 300 characters or less' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('trustfundx');
    
    // Check if user already exists
    const existingUser = await db.collection<UserDocument>('users').findOne({ 
      walletAddress 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this wallet address already exists' },
        { status: 409 }
      );
    }

    // Check if email is provided and already exists
    if (email) {
      const existingEmail = await db.collection<UserDocument>('users').findOne({ 
        email 
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Create new user
    const newUser: UserDocument = {
      walletAddress,
      role: role as UserRole,
      name,
      email,
      organization,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<UserDocument>('users').insertOne(newUser);

    // Generate JWT token
    const token = await signJWT({
      walletAddress: newUser.walletAddress,
      role: newUser.role,
      userId: result.insertedId.toString(),
    });

    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: result.insertedId.toString(),
          walletAddress: newUser.walletAddress,
          role: newUser.role,
          name: newUser.name,
          email: newUser.email,
          organization: newUser.organization,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.headers.set('Set-Cookie', setAuthCookie(token));

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
