import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import Ticket from "@/models/Ticket";
import mongoose from "mongoose";
import { getSession } from "@/lib/Auth";

// 🔹 Helper function to locate a business
async function findBusiness(id, userId, role) {
  const isOid = mongoose.Types.ObjectId.isValid(id);

  if (role === "business") {
    const q = { $or: [], businessAccount: userId };
    if (isOid) q.$or.push({ _id: id });
    q.$or.push({ bidNumber: id });
    return Business.findOne(q).lean();
  }

  if (role === "officer") {
    return isOid
      ? Business.findById(id).lean()
      : Business.findOne({ bidNumber: id }).lean();
  }

  return null;
}

// 🔹 GET handler
export async function GET(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role, id: userId } = session.user;

  try {
    const business = await findBusiness(id, userId, role);
    if (!business) {
      return NextResponse.json(
        { error: "You have no business like that." },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear();

    const latestTicket = await Ticket.findOne({ business: business._id })
      .sort({ createdAt: -1 })
      .lean();

    const inspectionCountThisYear = await Ticket.countDocuments({
      business: business._id,
      inspectionStatus: "completed",
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    });

    const now = new Date();
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const graceEnd = new Date(now.getFullYear() + 1, 0, 15);

    let permitStatus = "unknown";
    if (business.sanitaryPermitIssuedAt) {
      const issuedYear = new Date(business.sanitaryPermitIssuedAt).getFullYear();
      if (issuedYear === currentYear && now <= yearEnd) {
        permitStatus = "valid";
      } else if (issuedYear === currentYear && now > yearEnd && now <= graceEnd) {
        permitStatus = "in grace period";
      } else {
        permitStatus = "expired";
      }
    }

    const enriched = {
      ...business,
      inspectionStatus: latestTicket ? latestTicket.inspectionStatus : "none",
      ticketId: latestTicket ? latestTicket._id : null,
      inspectionCountThisYear,
      recordedViolation: latestTicket?.violation || "-",
      checklist: latestTicket?.checklist || null,
      permitStatus,
    };

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role, id: userId, fullName } = session.user; // ✅ include fullName
  const body = await request.json();

  const updateFields = {};

  if (body.newRequestType) updateFields.requestType = body.newRequestType;
  if (body.newBidNumber) updateFields.bidNumber = body.newBidNumber;
  if (body.newBusinessName) updateFields.businessName = body.newBusinessName;
  if (body.newBusinessNickname)
    updateFields.businessNickname = body.newBusinessNickname;
  if (body.newBusinessEstablishment)
    updateFields.businessEstablishment = body.newBusinessEstablishment;
  if (body.newBusinessType) updateFields.businessType = body.newBusinessType;
  if (body.newBusinessAddress)
    updateFields.businessAddress = body.newBusinessAddress;
  if (body.newStatus) updateFields.status = body.newStatus;
  if (body.newRequirements) updateFields.requirements = body.newRequirements;
  if (body.newContactPerson)
    updateFields.contactPerson = body.newContactPerson;
  if (body.newContactNumber)
    updateFields.contactNumber = body.newContactNumber;
  if (body.newLandmark) updateFields.landmark = body.newLandmark;
  if (body.newRemarks) updateFields.remarks = body.newRemarks;
  if (body.sanitaryPermitIssuedAt)
    updateFields.sanitaryPermitIssuedAt = new Date(body.sanitaryPermitIssuedAt);
  if (body.healthCertificateChecklist)
    updateFields.healthCertificateChecklist = body.healthCertificateChecklist;
  if (Array.isArray(body.sanitaryPermitChecklist))
    updateFields.sanitaryPermitChecklist = body.sanitaryPermitChecklist;
  if (Array.isArray(body.msrChecklist))
    updateFields.msrChecklist = body.msrChecklist;
  if (body.orDateHealthCert)
    updateFields.orDateHealthCert = new Date(body.orDateHealthCert);
  if (body.orNumberHealthCert)
    updateFields.orNumberHealthCert = body.orNumberHealthCert;
  if (typeof body.healthCertSanitaryFee === "number")
    updateFields.healthCertSanitaryFee = body.healthCertSanitaryFee;
  if (typeof body.healthCertFee === "number")
    updateFields.healthCertFee = body.healthCertFee;
  if (typeof body.declaredPersonnel === "number")
    updateFields.declaredPersonnel = body.declaredPersonnel;
  if (body.declaredPersonnelDueDate)
    updateFields.declaredPersonnelDueDate = new Date(body.declaredPersonnelDueDate);
  if (typeof body.healthCertificates === "number")
    updateFields.healthCertificates = body.healthCertificates;
  if (typeof body.healthCertBalanceToComply === "number")
    updateFields.healthCertBalanceToComply = body.healthCertBalanceToComply;
  if (body.healthCertDueDate)
    updateFields.healthCertDueDate = new Date(body.healthCertDueDate);

  try {
    const business = await findBusiness(id, userId, role);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    // ✅ Auto-attach officer details when completing
    if (role === "officer" && body.newStatus === "completed") {
      updateFields.officerInCharge = fullName || "Unknown Officer";
      updateFields.approvedAt = new Date(); // optional timestamp
    }

    const updated = await Business.findByIdAndUpdate(business._id, updateFields, {
      new: true,
    }).lean();

    return NextResponse.json(
      { msg: "Business updated", business: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update business", details: err.message },
      { status: 500 }
    );
  }
}


// 🔹 DELETE handler
export async function DELETE(request, { params }) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role, id: userId } = session.user;

  try {
    const business = await findBusiness(id, userId, role);
    if (!business) {
      return NextResponse.json(
        { error: "You have no business like that." },
        { status: 404 }
      );
    }

    await Business.findByIdAndDelete(business._id);
    return NextResponse.json(
      { message: "Business deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete business", details: err.message },
      { status: 500 }
    );
  }
}
