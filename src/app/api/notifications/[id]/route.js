import connectMongoDB from "@/lib/ConnectMongodb";
import Business from "@/models/Business";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongoDB();

  try {
    // Fetch only businesses that are in any pending/completed status
    const businesses = await Business.find({
      status: { $in: ["pending", "pending2", "pending3", "completed"] },
    })
      .select("bidNumber businessName status")
      .lean();

    // Build notification messages dynamically
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
          message = `BID-${biz.bidNumber}: Your request for "${biz.businessName}" has been approved! Please visit the office to claim your printed Sanitary Permit.`;
          break;

        default:
          message = `BID-${biz.bidNumber}: Your request status is currently "${biz.status}".`;
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
