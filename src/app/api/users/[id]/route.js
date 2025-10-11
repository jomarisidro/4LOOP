import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withCors } from "@/lib/cors"; // ✅ add this

export const GET = withCors(async (_request, context) => {
  await connectMongoDB();

  // ✅ destructure params from context
  const { id } = context.params;
  const userId = id?.trim();

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: "Invalid user ID format" },
      { status: 400 }
    );
  }

  try {
    const user = await User.findById(userId)
      .select(
        "_id fullName email role businessAccount profilePicture assignedArea verified"
      )
      .lean();

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
});

// ✅ OPTIONS handler for CORS preflight
export const OPTIONS = withCors(() => new NextResponse(null, { status: 204 }));
