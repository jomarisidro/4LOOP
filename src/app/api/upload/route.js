import connectMongoDB from "@/lib/ConnectMongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request) {
  await connectMongoDB();

  const { userId, imageData } = await request.json();

  if (!userId || !imageData) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: imageData },
      { new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
