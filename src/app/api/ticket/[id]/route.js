import Business from "@/models/Business";
import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Ticket from "@/models/Ticket";
import { getSession } from "@/lib/Auth";
import Violation from "@/models/Violation"; // ✅ Import Violation model

export async function GET(request, { params }) {
  await connectMongoDB();

  try {
    const { id } = params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await Ticket.findById(id).populate(
      "business",
      "businessName bidNumber businessType contactPerson businessAddress"
    );

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket, { status: 200 });
  } catch (err) {
    console.error("Ticket fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await connectMongoDB();

  try {
    const { id } = params;
    const body = await request.json();
    const { inspectionStatus, inspectionDate, remarks, inspectionChecklist } = body;

    const session = await getSession();
    const officerId = session?.user?.id;
    if (!officerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await Ticket.findById(id).populate("business");
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 🟠 Cancel inspection (only if pending)
    if (inspectionStatus === "none") {
      if (ticket.inspectionStatus !== "pending") {
        return NextResponse.json(
          { error: "Only pending inspections can be cancelled" },
          { status: 400 }
        );
      }
      ticket.inspectionStatus = "none";
    }

    // 🟡 Save/update — set to pending only when user saves
    if (inspectionStatus === "pending") {
      ticket.inspectionStatus = "pending";
      if (inspectionDate) ticket.inspectionDate = new Date(inspectionDate);
      if (remarks !== undefined) ticket.remarks = remarks;
    }

    // 🟢 COMPLETION FLOW
    if (inspectionStatus === "completed") {
      // Count completed inspections for this business this year, excluding current ticket
      const year = new Date().getFullYear();
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${year}-12-31T23:59:59Z`);

      const completedThisYear = await Ticket.countDocuments({
        business: ticket.business._id,
        inspectionStatus: "completed",
        createdAt: { $gte: start, $lte: end },
        _id: { $ne: ticket._id }, // exclude current ticket
      });

      if (completedThisYear >= 2) {
        return NextResponse.json(
          { error: "Maximum of 2 completed inspections per year reached." },
          { status: 400 }
        );
      }

      ticket.inspectionStatus = "completed";
      if (inspectionDate) ticket.inspectionDate = new Date(inspectionDate);
      if (remarks !== undefined) ticket.remarks = remarks;

      // ✅ Normalize checklist structure
      if (inspectionChecklist) {
        ticket.inspectionChecklist = {
          ...inspectionChecklist,
          healthCertificates: {
            actualCount: Number(inspectionChecklist?.healthCertificates?.actualCount) || 0,
            withCert: Number(inspectionChecklist?.healthCertificates?.withCert) || 0,
            withoutCert: Number(inspectionChecklist?.healthCertificates?.withoutCert) || 0,
          },
        };
        ticket.markModified("inspectionChecklist");
      }

      // Assign inspectionNumber strictly 1 or 2
      ticket.inspectionNumber = completedThisYear + 1;

      // 🆕 Detect non-compliance after 2nd inspection
      if (ticket.inspectionNumber === 2) {
        const checklist = inspectionChecklist || {};

        const noSP = checklist.sanitaryPermit === "without";
        const hcData = checklist.healthCertificates || {};
        const noHC = hcData.withoutCert > 0;
        const noCPDW = checklist.certificateOfPotability === "x";
        const noPC = checklist.pestControl === "x";

        if (noSP || noHC || noCPDW || noPC) {
          let violationCode = "other";
          let description = "Failed to comply after 2nd inspection.";

          if (noSP) {
            violationCode = "no_sanitary_permit";
            description = "Business failed to secure a Sanitary Permit after 2nd inspection.";
          } else if (noHC) {
            violationCode = "no_health_certificate";
            description = "Employees failed to secure valid Health Certificates after 2nd inspection.";
          } else if (noCPDW) {
            violationCode = "failure_renew_sanitary";
            description = "No valid Certificate of Potability of Drinking Water after 2nd inspection.";
          } else if (noPC) {
            violationCode = "pest_control_noncompliance";
            description = "No valid pest control compliance after 2nd inspection.";
          }

          // ✅ Create violation record
          const violation = await Violation.create({
            ticket: ticket._id,
            code: violationCode,
            description,
            penalty: 2000, // Can be adjusted based on Ordinance No. 53, s.2022
            ordinanceSection: "Ordinance No. 53, s.2022",
            offenseCount: 1,
            violationStatus: "pending", // ✅ updated field name

          });

          // Link the violation to this ticket
          ticket.violations.push(violation._id);
          ticket.resolutionStatus = "for compliance"; // Optional: case now under review
        }
      }
    }

    await ticket.save();

    const populatedTicket = await ticket.populate(
      "business",
      "businessName bidNumber businessType contactPerson"
    );

    return NextResponse.json(
      { msg: "Ticket updated", ticket: populatedTicket },
      { status: 200 }
    );
  } catch (err) {
    console.error("Ticket update error:", err);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await connectMongoDB();

  try {
    const { id } = params;

    const session = await getSession();
    const officerId = session?.user?.id;
    if (!officerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ msg: "Ticket deleted" }, { status: 200 });
  } catch (err) {
    console.error("Ticket delete error:", err);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
