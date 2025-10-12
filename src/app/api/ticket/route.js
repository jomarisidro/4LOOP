import Violation from "@/models/Violation"; // ✅ Register the model
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Ticket from "@/models/Ticket";
import Business from "@/models/Business";
import { getSession } from "@/lib/Auth";
import mongoose from "mongoose";

// GET /api/ticket
export async function GET(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const businessId = searchParams.get("businessId");
    const year = searchParams.get("year");

    const query = {};
    if (status) query.inspectionStatus = status;

    if (businessId) {
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
      }
      query.business = new mongoose.Types.ObjectId(businessId);
    }

    if (year) {
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year}-12-31T23:59:59Z`);
      query.createdAt = { $gte: start, $lte: end };
    }

    // ✅ FIXED: populate both business & violations
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 }) // newest first
      .populate(
        "business",
        "businessName bidNumber businessType contactPerson businessAddress"
      )
      .populate({
        path: "violations",
        select: "code ordinanceSection description penalty violationStatus createdAt",
      })
      .lean();

    return NextResponse.json(tickets, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching tickets:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// POST /api/ticket
export async function POST(request) {
  await connectMongoDB();

  try {
    const body = await request.json();
    const {
      bidNumber,
      businessId,
      inspectionType,
      violationType,
      violation,
      remarks,
      inspectionDate,
      inspectionChecklist,
      inspectionStatus,
    } = body;

    const session = await getSession();
    const officerId = session?.user?.id;
    if (!officerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find business
    let business;
    if (businessId) business = await Business.findById(businessId);
    else if (bidNumber) business = await Business.findOne({ bidNumber });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Count COMPLETED inspections for the current year
    const currentYear = new Date().getFullYear();
    const start = new Date(`${currentYear}-01-01T00:00:00Z`);
    const end = new Date(`${currentYear}-12-31T23:59:59Z`);

    const completedInspectionsThisYear = await Ticket.countDocuments({
      business: business._id,
      inspectionStatus: "completed",
      createdAt: { $gte: start, $lte: end },
    });

    // 🚨 CHANGE: Block only if already 2 completed and this one is also "completed"
    if (inspectionStatus === "completed" && completedInspectionsThisYear >= 2) {
      return NextResponse.json(
        {
          error: `Maximum of 2 completed inspections per year reached for ${business.businessName}.`,
        },
        { status: 400 }
      );
    }

    // Generate ticket number
    const count = await Ticket.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const ticketNumber = `TKT-${currentYear}-${String(count + 1).padStart(3, "0")}`;

    // 🚨 CHANGE: inspectionNumber is based on actual completed count (+1 if this one is completed)
    const inspectionNumber =
      inspectionStatus === "completed"
        ? completedInspectionsThisYear + 1
        : completedInspectionsThisYear;

    // 🚨 CHANGE: fallback type is tied to inspectionNumber
    const typeToUse = inspectionNumber === 1 ? "routine" : "reinspection";

const ticket = await Ticket.create({
  ticketNumber,
  business: business._id,
  businessAccount: business.businessAccount,
  officerInCharge: officerId,
  inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
  inspectionType: inspectionType || typeToUse,
  violationType: violationType || "sanitation",
  violation,
  remarks,
  inspectionChecklist: {
    ...inspectionChecklist,
    healthCertificates: {
      actualCount: Number(inspectionChecklist?.healthCertificates?.actualCount) || 0,
      withCert: Number(inspectionChecklist?.healthCertificates?.withCert) || 0,
      withoutCert: Number(inspectionChecklist?.healthCertificates?.withoutCert) || 0,
    },
  },
  inspectionStatus: inspectionStatus || "pending",
  resolutionStatus: "none",
  inspectionNumber,
});


    const populatedTicket = await ticket.populate(
      "business",
      "businessName bidNumber businessType contactPerson"
    );

    return NextResponse.json(
      { msg: "Ticket created successfully", ticket: populatedTicket },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Ticket creation error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
