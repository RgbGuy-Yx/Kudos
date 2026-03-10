import { NextRequest, NextResponse } from 'next/server';
import { signJWT, setAuthCookie } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { role, walletAddress } = await request.json();
    
    // Create/update dummy user
    const client = await clientPromise;
    const db = client.db('trustfundx');
    
    await db.collection('users').updateOne(
      { walletAddress },
      { 
        $set: { 
          walletAddress, 
          role, 
          name: 'Test ' + role,
          email: 'test@example.com',
          organization: 'Test Org' 
        } 
      },
      { upsert: true }
    );
    
    const user = await db.collection('users').findOne({ walletAddress });

    const token = await signJWT({
      walletAddress,
      role,
      userId: user!._id.toString(),
    });

    const response = NextResponse.json({ success: true, user });
    response.headers.set('Set-Cookie', setAuthCookie(token));

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
