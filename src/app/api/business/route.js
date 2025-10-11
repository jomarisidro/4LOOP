import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import Ticket from "@/models/Ticket";
import { getSession } from "@/lib/Auth";
import { Types } from "mongoose";

export async function GET(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id: userId } = session.user;
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    if (role !== "officer") {
      delete queryParams.businessAccount;
      delete queryParams._id;
      delete queryParams.email;
    }

    let filter = {};
    if (role === "business") {
      filter = { ...queryParams, businessAccount: userId };
    } else if (role === "officer") {
      filter = { ...queryParams };
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const businesses = await Business.find(filter).lean();
    const currentYear = new Date().getFullYear();

    const enriched = await Promise.all(
      businesses.map(async (b) => {
        const latestTicket = await Ticket.findOne({ business: b._id })
          .sort({ createdAt: -1 })
          .lean();

        const inspectionCountThisYear = await Ticket.countDocuments({
          business: b._id,
          inspectionStatus: "completed",
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        });

        // ✅ Compute sanitation permit status
        const now = new Date();
        const yearEnd = new Date(now.getFullYear(), 11, 31); // Dec 31
        const graceEnd = new Date(now.getFullYear() + 1, 0, 15); // Jan 15 next year

        let permitStatus = "-";
        if (b.sanitaryPermitIssuedAt) {
          const issuedYear = new Date(b.sanitaryPermitIssuedAt).getFullYear();
          if (issuedYear === currentYear && now <= yearEnd) {
            permitStatus = "valid";
          } else if (issuedYear === currentYear && now > yearEnd && now <= graceEnd) {
            permitStatus = "in grace period";
          } else {
            permitStatus = "expired";
          }
        }

        return {
          ...b,
          inspectionStatus: latestTicket ? latestTicket.inspectionStatus : "none",
          ticketId: latestTicket ? latestTicket._id : null,
          inspectionCountThisYear,
          recordedViolation: latestTicket?.violation || "-",
          checklist: latestTicket?.checklist || null,
          permitStatus, // ✅ added
        };
      })
    );

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching businesses:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  await connectMongoDB();

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: userId } = session.user;
  if (role !== "business") return NextResponse.json({ error: "Access denied" }, { status: 403 });

const {
  bidNumber = null,
  businessNickname = null,
  businessName = null,
  businessEstablishment = null,
  businessType = null,
  businessAddress = null,
  landmark = null,
  contactPerson = null,
  contactNumber = null,
  onlineRequest = null,
  requestType = null,
  remarks = null,
  status = null,
  requirements = null,
  sanitaryPermitChecklist = [],
  healthCertificateChecklist = [],
  msrChecklist = [],
  sanitaryPermitIssuedAt = null, // ✅ existing
  orDateHealthCert = null,       // ✅ add this
  orNumberHealthCert = null,     // ✅ add this
  healthCertSanitaryFee = null,  // ✅ add this
  healthCertFee = null,           // ✅ add this
   declaredPersonnel = null,
  dueDateToComply = null,
  healthCertificates = null,
  balanceToComply = null,
  dueDateFinal = null,
} = await request.json();


  const noRequestStatus = status || "draft";

  if (bidNumber) {
    const existing = await Business.findOne({ bidNumber });
    if (existing) {
      return NextResponse.json({ error: "Bid number already exists" }, { status: 409 });
    }
  }

  const activeStatuses = ["submitted", "pending", "pending2", "pending3", "pending4"];
  if (onlineRequest && activeStatuses.includes(noRequestStatus)) {
    const existingRequest = await Business.findOne({
      businessAccount: userId,
      onlineRequest: true,
      status: { $in: activeStatuses },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "🚫 There is already an ongoing sanitation request for this business." },
        { status: 409 }
      );
    }
  }

  const businessQuery = {
    businessAccount: new Types.ObjectId(userId),
  };

  if (bidNumber) businessQuery.bidNumber = bidNumber;
  if (businessNickname) businessQuery.businessNickname = businessNickname;
  if (businessName) businessQuery.businessName = businessName;
  if (businessEstablishment) businessQuery.businessEstablishment = businessEstablishment;
  if (businessType) businessQuery.businessType = businessType;
  if (businessAddress) businessQuery.businessAddress = businessAddress;
  if (landmark) businessQuery.landmark = landmark;
  if (contactPerson) businessQuery.contactPerson = contactPerson;
  if (contactNumber) businessQuery.contactNumber = contactNumber;
  if (onlineRequest) businessQuery.onlineRequest = onlineRequest;
  if (requestType) businessQuery.requestType = requestType;
  if (remarks) businessQuery.remarks = remarks;
  if (noRequestStatus) businessQuery.status = noRequestStatus;
  if (requirements) businessQuery.requirements = requirements;
  if (sanitaryPermitIssuedAt) businessQuery.sanitaryPermitIssuedAt = new Date(sanitaryPermitIssuedAt);

  if (sanitaryPermitChecklist.length) businessQuery.sanitaryPermitChecklist = sanitaryPermitChecklist;
  if (healthCertificateChecklist.length) businessQuery.healthCertificateChecklist = healthCertificateChecklist;
  if (msrChecklist.length) businessQuery.msrChecklist = msrChecklist;

if (orDateHealthCert) businessQuery.orDateHealthCert = new Date(orDateHealthCert);
if (orNumberHealthCert) businessQuery.orNumberHealthCert = orNumberHealthCert;
if (typeof healthCertSanitaryFee === "number") businessQuery.healthCertSanitaryFee = healthCertSanitaryFee;
if (typeof healthCertFee === "number") businessQuery.healthCertFee = healthCertFee;

if (declaredPersonnel !== null) businessQuery.declaredPersonnel = declaredPersonnel;
if (dueDateToComply) businessQuery.dueDateToComply = new Date(dueDateToComply);
if (healthCertificates !== null) businessQuery.healthCertificates = healthCertificates;
if (balanceToComply !== null) businessQuery.balanceToComply = balanceToComply;
if (dueDateFinal) businessQuery.dueDateFinal = new Date(dueDateFinal);



  try {
    const business = new Business(businessQuery);
    await business.save();
    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error("❌ Error saving business:", err.message);
    return NextResponse.json({ error: "Failed to save business" }, { status: 500 });
  }
}
