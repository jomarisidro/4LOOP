import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(_request, context) {
  await connectMongoDB();

  const { id } = context.params;
  const userId = id?.trim();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
const user = await User.findById(userId)
  .select("_id fullName email role businessAccount profilePicture assignedArea verified accountDisabled")
  .lean();

if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

return NextResponse.json({
  user: {
    ...user,
    status: user.accountDisabled ? 'disabled' : 'active',
  },
});



    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Used for verifying business user accounts after registration.
 */
export async function PUT(request, context) {
  await connectMongoDB();

  const { id } = context.params;
  const userId = id?.trim();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { code, email } = body;

    if (!code || !email) {
      return NextResponse.json(
        { error: "Verification code and email are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.verified) {
      return NextResponse.json(
        { message: "User already verified" },
        { status: 200 }
      );
    }

    if (user.role !== "business") {
      return NextResponse.json(
        { error: "Only business accounts can be verified through this route" },
        { status: 403 }
      );
    }

    if (user.email !== email) {
      return NextResponse.json(
        { error: "Email does not match the registered account" },
        { status: 400 }
      );
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    // ✅ Mark as verified
    user.verified = true;
    user.verificationCode = null;
    await user.save();

    return NextResponse.json(
      { message: "Account successfully verified" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Verification error:", err);
    return NextResponse.json(
      { error: "Failed to verify user" },
      { status: 500 }
    );
  }
}
