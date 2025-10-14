import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function PUT(req, { params }) {
  await connectMongoDB();

  const { id } = params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountDisabled: false },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`✅ Enabled user account: ${user._id}`);

    return NextResponse.json(
      {
        success: true,
        message: "User account enabled successfully.",
        user: {
          _id: user._id,
          status: "active",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Enable error:", err);
    return NextResponse.json({ error: "Failed to enable user." }, { status: 500 });
  }
}
