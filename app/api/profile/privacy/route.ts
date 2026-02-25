import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';
import { connectDB } from '../../../libs/mongoConnect';
import Profile from '../../../models/Profile';
import { logActivity } from '../../../libs/activity-logger';

const privacySchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  searchable: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await Profile.findOne({ userId: session.user.id }).lean();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Fetch privacy settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = privacySchema.parse(body);

    await connectDB();

    const profile = await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: validatedData },
      { upsert: true, new: true }
    );

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'Privacy settings updated',
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);

   if (error instanceof z.ZodError) {
  return NextResponse.json({
    error: 'Validation error',
    details: error.issues, // ✅ correct property
  }, { status: 400 });
}

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
