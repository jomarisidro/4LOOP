import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import Ticket from "@/models/Ticket";
import Violation from "@/models/Violation";
import { getSession } from "@/lib/Auth";
import { Types } from "mongoose";

export async function GET(request) {
  await connectMongoDB();

  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id: userId } = session.user;
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Limit fields depending on role
    if (role !== "officer") {
      delete queryParams.businessAccount;
      delete queryParams._id;
      delete queryParams.email;
    }

    // Role-based filter
    let filter = {};
    if (role === "business") {
      filter = { ...queryParams, businessAccount: userId };
    } else if (["officer", "admin"].includes(role)) {
      filter = { ...queryParams };
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear}-12-31`);

    // 🚀 Use aggregation with $lookup (joins) for fast combined result
    const businesses = await Business.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "businessAccount",
          foreignField: "_id",
          as: "businessAccount",
          pipeline: [{ $project: { email: 1 } }],
        },
      },
      { $unwind: { path: "$businessAccount", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "tickets",
          let: { businessId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$business", "$$businessId"] },
                    {
                      $gte: ["$createdAt", startOfYear],
                    },
                    {
                      $lte: ["$createdAt", endOfYear],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                latestTicket: { $last: "$$ROOT" },
                completedCount: {
                  $sum: {
                    $cond: [{ $eq: ["$inspectionStatus", "completed"] }, 1, 0],
                  },
                },
                hasPending: {
                  $max: {
                    $cond: [{ $eq: ["$inspectionStatus", "pending"] }, 1, 0],
                  },
                },
              },
            },
          ],
          as: "ticketInfo",
        },
      },
      {
        $lookup: {
          from: "violations",
          let: { businessId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$business", "$$businessId"] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "violationInfo",
        },
      },
      { $unwind: { path: "$ticketInfo", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$violationInfo", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          inspectionStatus: {
            $ifNull: ["$ticketInfo.latestTicket.inspectionStatus", "none"],
          },
          inspectionCountThisYear: { $ifNull: ["$ticketInfo.completedCount", 0] },
          hasPending: { $ifNull: ["$ticketInfo.hasPending", 0] },
          violationSummary: {
            $cond: [
              { $ifNull: ["$violationInfo.code", false] },
              {
                $concat: [
                  { $toUpper: { $substrCP: ["$violationInfo.code", 0, 1] } },
                  {
                    $substrCP: [
                      "$violationInfo.code",
                      1,
                      { $subtract: [{ $strLenCP: "$violationInfo.code" }, 1] },
                    ],
                  },
                  " — ₱",
                  { $toString: "$violationInfo.penalty" },
                  " (",
                  "$violationInfo.status",
                  ")",
                ],
              },
              "-",
            ],
          },
        },
      },
      {
        $project: {
          businessAccount: 1,
          bidNumber: 1,
          businessName: 1,
          businessType: 1,
          contactPerson: 1,
          sanitaryPermitIssuedAt: 1,
          inspectionStatus: 1,
          inspectionCountThisYear: 1,
          hasPending: 1,
          violationSummary: 1,
        },
      },
    ]);

    // ✅ Compute permit validity only once (fast)
    const now = new Date();
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const graceEnd = new Date(now.getFullYear() + 1, 0, 15);

    const enriched = businesses.map((b) => {
      let permitStatus = "-";
      if (b.sanitaryPermitIssuedAt) {
        const issuedYear = new Date(b.sanitaryPermitIssuedAt).getFullYear();
        if (issuedYear === currentYear && now <= yearEnd) permitStatus = "valid";
        else if (issuedYear === currentYear && now > yearEnd && now <= graceEnd)
          permitStatus = "in grace period";
        else permitStatus = "expired";
      }
      return { ...b, permitStatus };
    });

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching businesses:", err);
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
    declaredPersonnelDueDate = null,
    healthCertificates = null,
    healthCertBalanceToComply = null,
    healthCertDueDate = null,
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

  if (sanitaryPermitChecklist?.length > 0)
    businessQuery.sanitaryPermitChecklist = sanitaryPermitChecklist;

  if (healthCertificateChecklist?.length > 0)
    businessQuery.healthCertificateChecklist = healthCertificateChecklist;

  if (msrChecklist?.length > 0)
    businessQuery.msrChecklist = msrChecklist;


  if (orDateHealthCert) businessQuery.orDateHealthCert = new Date(orDateHealthCert);
  if (orNumberHealthCert) businessQuery.orNumberHealthCert = orNumberHealthCert;
  if (typeof healthCertSanitaryFee === "number") businessQuery.healthCertSanitaryFee = healthCertSanitaryFee;
  if (typeof healthCertFee === "number") businessQuery.healthCertFee = healthCertFee;

  if (declaredPersonnel !== null) businessQuery.declaredPersonnel = declaredPersonnel;
  if (declaredPersonnelDueDate) businessQuery.declaredPersonnelDueDate = new Date(declaredPersonnelDueDate);
  if (healthCertificates !== null) businessQuery.healthCertificates = healthCertificates;
  if (healthCertBalanceToComply !== null) businessQuery.healthCertBalanceToComply = healthCertBalanceToComply;
  if (healthCertDueDate) businessQuery.healthCertDueDate = new Date(healthCertDueDate);

  try {
    const business = new Business(businessQuery);
    await business.save();
    return NextResponse.json(business, { status: 200 });
  } catch (err) {
    console.error("❌ Error saving business:", err.message);
    console.error("📦 Payload:", businessQuery);
    return NextResponse.json({ error: "Failed to save business" }, { status: 500 });
  }
}