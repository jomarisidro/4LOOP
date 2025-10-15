import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { decrypt } from "@/lib/Auth"; // ✅ Session validation

export async function GET(request, context) {
  await connectMongoDB();

  const { id } = context.params;
  const userId = id?.trim();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  // 🔐 Validate session
  const token = request.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const session = await decrypt(token);
    const sessionUser = session?.user;

    // 🚫 Only allow admin or self
    if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(userId)
      .select("_id fullName email role businessAccount profilePicture assignedArea verified accountDisabled")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        status: user.accountDisabled ? "disabled" : "active",
      },
    }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

export async function PUT(request, context) {
  await connectMongoDB();

  const { id } = context.params;
  const userId = id?.trim();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
  }

  // 🔐 Validate session
  const token = request.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const session = await decrypt(token);
    const sessionUser = session?.user;

    // 🚫 Only allow admin or self
    if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // ✅ Officer Profile / Password Update
    if (body.action === "updateProfile" || body.action === "changePassword") {
      const { fullName, email, currentPassword, newPassword } = body;
      const user = await User.findById(userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      if (fullName) user.fullName = fullName;
      if (email) user.email = email;

      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password is required." }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json({ error: "Incorrect current password." }, { status: 401 });
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
          return NextResponse.json({
            error: "Weak password. Must include upper & lowercase letters, a number, a special character, and be at least 8 characters long.",
          }, { status: 400 });
        }

        user.password = await bcrypt.hash(newPassword, 10);
      }

      await user.save();
      console.log(`🔧 Profile updated for user ${userId}`);

      return NextResponse.json({ success: true, message: "Profile updated successfully." }, { status: 200 });
    }

    // ✅ Business Verification
    const { code, email } = body;
    if (!code || !email) {
      return NextResponse.json({ error: "Verification code and email are required." }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.verified) {
      return NextResponse.json({ message: "User already verified", verified: true }, { status: 200 });
    }

    if (user.role !== "business") {
      return NextResponse.json({ error: "Only business accounts can be verified through this route." }, { status: 403 });
    }

    if (user.email !== email) {
      return NextResponse.json({ error: "Email does not match the registered account." }, { status: 400 });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 401 });
    }

    user.verified = true;
    user.verificationCode = null;
    await user.save();

    console.log(`✅ Verified business account for ${email}`);

    return NextResponse.json({
      message: "Account successfully verified",
      verified: true,
      status: "active",
    }, { status: 200 });
  } catch (err) {
    console.error("❌ Verification or Profile Update Error:", err);
    return NextResponse.json({ error: "Failed to verify or update user." }, { status: 500 });
  }
}
