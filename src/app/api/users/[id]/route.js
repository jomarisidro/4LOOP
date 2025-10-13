import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // 👈 Added for password hashing

export async function GET(_request, context) {
  await connectMongoDB();

  const { id } = await context.params;
  const userId = id?.trim();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    const user = await User.findById(userId)
      .select(
        "_id fullName email role businessAccount profilePicture assignedArea verified accountDisabled"
      )
      .lean();

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      user: {
        ...user,
        status: user.accountDisabled ? "disabled" : "active",
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
 * Used for verifying business user accounts after registration
 * 🆕 Also handles officer profile and password update
 */
export async function PUT(request, context) {
  await connectMongoDB();

  const { id } = await context.params;
  const userId = id?.trim();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // ✅ Officer Profile / Password Update Logic
    if (body.action === "updateProfile" || body.action === "changePassword") {
      const { fullName, email, currentPassword, newPassword } = body;

      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Update profile info if provided
      if (fullName) user.fullName = fullName;
      if (email) user.email = email;

      // Change password if requested
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to change password." },
            { status: 400 }
          );
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json(
            { error: "Incorrect current password." },
            { status: 401 }
          );
        }

        // ✅ Validate password strength
        const strongPasswordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
          return NextResponse.json(
            {
              error:
                "Weak password. Must include upper & lowercase letters, a number, a special character, and be at least 8 characters long.",
            },
            { status: 400 }
          );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
      }

      await user.save();

      return NextResponse.json(
        { success: true, message: "Profile updated successfully." },
        { status: 200 }
      );
    }

    // ✅ Existing Business Verification Logic (retained)
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
        {
          error:
            "Only business accounts can be verified through this route",
        },
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
    console.error("❌ Verification or Profile Update Error:", err);
    return NextResponse.json(
      { error: "Failed to verify or update user." },
      { status: 500 }
    );
  }
}
