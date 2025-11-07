import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Notification from "@/models/Notification";
import { getSession } from "@/lib/Auth";
import Ticket from "@/models/Ticket";
import Business from "@/models/Business";

// 🔵 POST — create a new notification (used by officer actions)
export async function POST(request) {
  await connectMongoDB();

  try {
    const { user, title, message, category, business } = await request.json();

    if (!user || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields (user, title, message)" },
        { status: 400 }
      );
    }

    const notif = await Notification.create({
      user,
      title,
      message,
      category,
      business,
      isRead: false,
      isDeleted: false,
    });

    return NextResponse.json(
      { msg: "Notification created successfully", notif },
      { status: 201 }
    );
  } catch (error) {
    console.error("Notification POST error:", error);
    return NextResponse.json(
      { error: "Failed to create notification", details: error.message },
      { status: 500 }
    );
  }
}

// 🟢 GET — fetch notifications for the logged-in business account
export async function GET() {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  if (role !== "business") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const notifications = await Notification.find({
      user: userId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("ticket", "inspectionStatus inspectionNumber")
      .populate("business", "businessName bidNumber")
      .lean();

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Notification GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: error.message },
      { status: 500 }
    );
  }
}

// 🟡 PATCH — mark notification as read
export async function PATCH(request) {
  await connectMongoDB();

  try {
    const { id } = await request.json();

    const notif = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { msg: "Notification marked as read", notif },
      { status: 200 }
    );
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update notification", details: error.message },
      { status: 500 }
    );
  }
}

// 🔴 DELETE — allow business user to delete their own notification
export async function DELETE(request) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  if (role !== "business") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }

    const notif = await Notification.findOne({ _id: id, user: userId });
    if (!notif) {
      return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
    }

    notif.isDeleted = true;
    await notif.save();

    return NextResponse.json({ msg: "Notification deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Notification DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification", details: error.message },
      { status: 500 }
    );
  }
}
