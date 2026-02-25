'use server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '../../../libs/mongoConnect';
import User from '../../../models/User'
import Transaction from "../../../models/Transaction";
import { z, ZodError } from 'zod';
import { logActivity } from '../../../libs/activity-logger';

// ---------------- Validation Schema ----------------
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  // Allow both URLs and base64 images
  image: z.string().optional().nullable().refine(
    (val) => !val || val.startsWith('http') || val.startsWith('data:image/'),
    { message: 'Image must be a valid URL or base64 data' }
  ),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().nullable().optional().refine(
    (val) => !val || !isNaN(new Date(val).getTime()),
    { message: 'Invalid date format' }
  ),
  website: z.string().url().optional().nullable().or(z.literal('')),
  github: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
});


// ---------------- POST Handler ----------------
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 1️⃣ Check user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2️⃣ Parse request body & validate
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let updateData = parsed.data;

    // 3️⃣ Convert empty strings to null
    Object.keys(updateData).forEach((key) => {
      const val = updateData[key as keyof typeof updateData];
      if (val === '') updateData[key as keyof typeof updateData] = null;
    });

    // 4️⃣ Remove undefined fields
    Object.keys(updateData).forEach(
      (key) =>
        updateData[key as keyof typeof updateData] === undefined &&
        delete updateData[key as keyof typeof updateData]
    );

    // 5️⃣ Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true }
    );

    // 6️⃣ Log activity
    await logActivity({
      userId: session.user.id,
      action: 'Profile updated',
      request,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
