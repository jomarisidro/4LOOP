import Violation from "@/models/Violation";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Ticket from "@/models/Ticket";
import Business from "@/models/Business";
import { getSession } from "@/lib/Auth";
import mongoose from "mongoose";

// =========================
// GET /api/ticket
// =========================
export async function GET(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const businessId = searchParams.get("businessId");
    const year = searchParams.get("year");

    const query = {};

    // ✅ Filter by status if provided
    if (status) query.inspectionStatus = status;

    // ✅ Business filter (allow officer/admin to view any, business only theirs)
    if (role === "business") {
      query.businessAccount = userId;
    } else if (businessId) {
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
      }
      query.business = new mongoose.Types.ObjectId(businessId);
    }

    // ✅ Year filter
    if (year) {
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year}-12-31T23:59:59Z`);
      query.createdAt = { $gte: start, $lte: end };
    }

    // ✅ Restrict access for unknown roles
    if (!["officer", "admin", "business"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Populate business with requestType included
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate(
        "business",
        "businessName bidNumber businessType contactPerson businessAddress requestType"
      )
      .populate({
        path: "violations",
        select:
          "code ordinanceSection description penalty violationStatus createdAt",
      })
      .lean();

    return NextResponse.json(tickets, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching tickets:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// =========================
// POST /api/ticket
// =========================
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
    const { id: officerId, role } = session?.user || {};

    if (!officerId || !["officer", "admin"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🏢 Find business by ID or BID number
    let business;
    if (businessId) business = await Business.findById(businessId);
    else if (bidNumber) business = await Business.findOne({ bidNumber });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 📅 Get current year range
    const currentYear = new Date().getFullYear();
    const start = new Date(`${currentYear}-01-01T00:00:00Z`);
    const end = new Date(`${currentYear}-12-31T23:59:59Z`);

    // ✅ Count completed inspections for this business this year
    const completedInspectionsThisYear = await Ticket.countDocuments({
      business: business._id,
      inspectionStatus: "completed",
      createdAt: { $gte: start, $lte: end },
    });

    // 🚫 Limit 2 completed inspections per year
    if (inspectionStatus === "completed" && completedInspectionsThisYear >= 2) {
      return NextResponse.json(
        {
          error: `Maximum of 2 completed inspections per year reached for ${business.businessName}.`,
        },
        { status: 400 }
      );
    }

    // 🎫 Generate ticket number (unique per year)
    const count = await Ticket.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });
    const ticketNumber = `TKT-${currentYear}-${String(count + 1).padStart(3, "0")}`;

    // 🔢 Compute inspection number
    const inspectionNumber =
      inspectionStatus === "completed"
        ? completedInspectionsThisYear + 1
        : completedInspectionsThisYear;

    // 🔄 Determine inspection type based on count
    const typeToUse = inspectionNumber === 1 ? "routine" : "reinspection";

    // 📝 Create ticket
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
          actualCount:
            Number(inspectionChecklist?.healthCertificates?.actualCount) || 0,
          withCert:
            Number(inspectionChecklist?.healthCertificates?.withCert) || 0,
          withoutCert:
            Number(inspectionChecklist?.healthCertificates?.withoutCert) || 0,
        },
      },
      inspectionStatus: inspectionStatus || "pending",
      resolutionStatus: "none",
      inspectionNumber,
    });

    // ✅ Populate with business (including requestType)
    const populatedTicket = await ticket.populate(
      "business",
      "businessName bidNumber businessType contactPerson businessAddress requestType"
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
