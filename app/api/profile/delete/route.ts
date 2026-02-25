import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../libs/mongoConnect';
import User from '../../../models/User';
import Profile from '../../../models/Profile';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
  confirmation: z
    .literal('DELETE')
    .refine(val => val === 'DELETE', {
      message: 'You must type DELETE to confirm',
    }),
});


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    await connectDB();

    // Find user
    const user = await User.findById(session.user.id).select(
      '_id password email'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has password (not OAuth only)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 400 }
        );
      }
    }

    // 🔥 Manual cascading delete (Mongo doesn't auto-cascade like Prisma)

    // Delete profile
    await Profile.deleteOne({ userId: user._id.toString() });

    // Delete other collections if you have:
    // await Goal.deleteMany({ userId: user._id });
    // await Activity.deleteMany({ userId: user._id });
    // await Session.deleteMany({ userId: user._id });

    // Finally delete user
    await User.findByIdAndDelete(user._id);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);

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
