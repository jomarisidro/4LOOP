import connectMongoDB from "@/lib/ConnectMongodb";
import Violation from "@/models/Violation";
import Ticket from "@/models/Ticket";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    // ✅ Find all tickets for this business
    const tickets = await Ticket.find({ business: businessId }).select("_id");
    const ticketIds = tickets.map((t) => t._id);

    // ✅ Fetch related violations (sorted newest first)
    const violations = await Violation.find({ ticket: { $in: ticketIds } })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(violations || [], { status: 200 });
  } catch (err) {
    console.error("Violation fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}
