import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/ConnectMongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function PUT(req, { params }) {
  await connectMongoDB();

  const { id } = params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountDisabled: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Match frontend expectation: return `user: { ... }`
    return NextResponse.json(
      {
        user: {
          _id: user._id,
          status: user.accountDisabled ? 'disabled' : 'active',
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Disable error:', err);
    return NextResponse.json({ error: 'Failed to disable user' }, { status: 500 });
  }
}
