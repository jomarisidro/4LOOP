import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import Business from "@/models/Business";
import { getSession } from "@/lib/Auth";

export async function GET() {
  await connectMongoDB();

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  try {
    // Fetch businesses relevant to this user (business owner or officer)
    const filter =
      role === "business"
        ? { businessAccount: userId, status: { $in: ["pending", "pending2", "pending3", "completed", "released"] } }
        : { status: { $in: ["pending", "pending2", "pending3", "completed", "released"] } };

    const businesses = await Business.find(filter)
      .select("bidNumber businessName status")
      .lean();

    // Build messages dynamically
    const notifications = businesses.map((biz) => {
      let message = "";

      switch (biz.status) {
        case "pending":
          message = `BID-${biz.bidNumber}: Your business "${biz.businessName}" is currently under verification.`;
          break;

        case "pending2":
          message = `BID-${biz.bidNumber}: Your business "${biz.businessName}" requires compliance documents. Please submit the necessary files.`;
          break;

        case "pending3":
          message = `BID-${biz.bidNumber}: Your business "${biz.businessName}" is now in the approval stage.`;
          break;

        case "completed":
          message = `BID-${biz.bidNumber}: Your request for "${biz.businessName}" has been approved! Please proceed to the office to claim your printed Sanitary Permit.`;
          break;

        case "released  ":
          message = `BID-${biz.bidNumber}: Your request for "${biz.businessName}" has been released. Thank you!`;
          break;

        default:
          message = `BID-${biz.bidNumber}: Your request status is "${biz.status}".`;
      }

      return {
        id: biz._id,
        bidNumber: biz.bidNumber,
        status: biz.status,
        message,
      };
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Notification GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
