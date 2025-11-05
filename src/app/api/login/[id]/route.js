import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(request, { params }) {
  try {
    await connectMongoDB();

    const { id: userId } = params;
    const body = await request.json();
    const { action } = body;

    // ✅ Change Password (Business Account)
    if (action === "changePassword") {
      const { currentPassword, newPassword } = body;

      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // ✅ Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 401 }
        );
      }

      // ✅ Password strength validation
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        return NextResponse.json(
          {
            error:
              "Weak password. Must include uppercase, lowercase, number, special character, and be 8+ chars long.",
          },
          { status: 400 }
        );
      }

      // ✅ Update password
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return NextResponse.json(
        { success: true, message: "Password updated successfully." },
        { status: 200 }
      );
    }

    // ❌ If action not recognized
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("❌ Error in PATCH /api/login/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
