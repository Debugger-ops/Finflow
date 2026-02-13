// app/api/profile/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import User, { IUser } from '../../../models/User'; // Mongoose User model
import { logActivity } from '../../../libs/activity-logger';

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data directly (no populate, all fields are embedded)
    const user = await User.findById(session.user.id).lean<IUser>();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Structure export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: {
        bio: user.bio || '',
        phone: user.phone || null,
        location: user.location || null,
        occupation: user.occupation || null,
        dateOfBirth: user.dateOfBirth || null,
        website: user.website || null,
        github: user.github || null,
        linkedin: user.linkedin || null,
        twitter: user.twitter || null,
        // Notification, privacy, and appearance settings
        // notificationSettings: user.profile?.notificationSettings || {},
        // privacySettings: user.profile?.privacySettings || {},
        // appearanceSettings: user.profile?.appearanceSettings || {},
      },
      connectedAccounts: user.accounts || [],
      activeSessions: user.sessions || [],
      recentActivities: user.activities || [],
    };

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'Data exported',
      request,
    });

    // Return JSON as downloadable file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="profile-data-${user._id}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
