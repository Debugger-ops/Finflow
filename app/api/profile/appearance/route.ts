import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../libs/mongoConnect';
import Profile from '../../../models/Profile';
import { z } from 'zod';
import { logActivity } from '../../../libs/activity-logger';

const appearanceSchema = z.object({
  darkMode: z.boolean().optional(),
  compactView: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  language: z.string().optional(),
  theme: z.enum(['default', 'blue', 'green', 'purple']).optional(),
});


// -------------------- GET --------------------
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await Profile.findOne({
      userId: session.user.id,
    }).lean();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Fetch appearance settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// -------------------- POST --------------------
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = appearanceSchema.parse(body);

    await connectDB();

    const profile = await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: validatedData },
      { new: true, upsert: true }
    );

    // Log activity (if you're still using it)
    await logActivity({
      userId: session.user.id,
      action: 'Appearance settings updated',
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Appearance settings updated successfully',
      data: profile,
    });
  } catch (error: any) {
    console.error('Update appearance settings error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
