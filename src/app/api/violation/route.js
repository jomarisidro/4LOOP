import connectMongoDB from "@/lib/ConnectMongodb";
import Violation from "@/models/Violation";
import Ticket from "@/models/Ticket";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const ticketIds = await Ticket.distinct("_id", { business: businessId });

    const violations = await Violation.find({ ticket: { $in: ticketIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(violations || [], { status: 200 });
  } catch (err) {
    console.error("Violation fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}
