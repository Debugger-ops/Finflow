// app/api/profile/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import User from '../../../models/User'; // Mongoose User model
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logActivity } from '../../../libs/activity-logger';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = passwordSchema.parse(body);

    // Get user with password
    const user = await User.findById(session.user.id).select('+password'); // Ensure password is selected

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Cannot change password for OAuth-only accounts' },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(validatedData.newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    // Hash new password
    user.password = await bcrypt.hash(validatedData.newPassword, 12);
    await user.save();

    // Log activity
    await logActivity({
      userId: user._id.toString(),
      action: 'Password changed',
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });

  } catch (error) {
    console.error('Password change error:', error);

    if (error instanceof z.ZodError) {
  return NextResponse.json({
    error: 'Validation error',
    details: error.issues, // ✅ use `issues` instead of `errors`
  }, { status: 400 });
}


    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
