import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(request) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const query = role ? { role } : {};
    const users = await User.find(query)
      .select("_id fullName email role businessAccount profilePicture assignedArea verified")
      .lean();

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  await connectMongoDB();

  try {
    const body = await request.json();
    const { role, email, password, fullName } = body;

    // Normalize role
    let normalizedRole;
    if (role === "Business Owner" || role === "business") {
      normalizedRole = "business";
    } else if (role === "officer") {
      normalizedRole = "officer";
    } else {
      return NextResponse.json(
        { error: "Invalid role. Only Business Owner or Officer allowed." },
        { status: 403 }
      );
    }

    // Validate required fields
    if (normalizedRole === "officer" && (!fullName || !email || !password)) {
      return NextResponse.json(
        { error: "Full name, email, and password are required for officer accounts." },
        { status: 400 }
      );
    }

    if (normalizedRole === "business" && (!email || !password)) {
      return NextResponse.json(
        { error: "Email and password are required for business accounts." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: normalizedRole,
      fullName: normalizedRole === "officer" ? fullName : undefined,
      verified: normalizedRole === "officer" ? true : false,
    });

    // For business accounts, link to themselves
    if (normalizedRole === "business") {
      newUser.businessAccount = newUser._id;
      await newUser.save();
    }

    return NextResponse.json(
      { msg: "User registered successfully", user: newUser },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", {
      message: err.message,
      stack: err.stack,
      cause: err.cause,
    });
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
