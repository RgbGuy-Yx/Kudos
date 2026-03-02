import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: User = await request.json();
    const { name, email, organization, role, walletAddress } = body;

    if (!name || !email || !organization || !role || !walletAddress) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ email }, { walletAddress }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or wallet already exists' },
        { status: 409 }
      );
    }

    const result = await db.collection('users').insertOne({
      name,
      email,
      organization,
      role,
      walletAddress,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
