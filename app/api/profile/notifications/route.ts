import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../libs/mongoConnect';
import User, { IUser, IProfile } from '../../../models/User';
import { z } from 'zod';
import { logActivity } from '../../../libs/activity-logger';

const notificationSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingNotifications: z.boolean().optional(),
  securityNotifications: z.boolean().optional(),
  updateNotifications: z.boolean().optional(),
  mentionNotifications: z.boolean().optional(),
  commentNotifications: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Tell TypeScript that user may have a profile
    const user = await User.findById(session.user.id).lean<{ profile?: IProfile }>();

    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = user.profile;

    return NextResponse.json({
      success: true,
      data: {
        emailNotifications: profile.emailNotifications ?? false,
        pushNotifications: profile.pushNotifications ?? false,
        marketingNotifications: profile.marketingNotifications ?? false,
        securityNotifications: profile.securityNotifications ?? false,
        updateNotifications: profile.updateNotifications ?? false,
        mentionNotifications: profile.mentionNotifications ?? false,
        commentNotifications: profile.commentNotifications ?? false,
      },
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = notificationSchema.parse(body);

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure profile exists
    if (!user.profile) user.profile = {};

    user.profile = { ...user.profile, ...validatedData };

    await user.save();

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'Notification settings updated',
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.profile,
    });
  } catch (error) {
    console.error('Update notifications error:', error);

    // ✅ Use `error.issues` instead of `error.errors`
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
