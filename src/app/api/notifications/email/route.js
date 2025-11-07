import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔹 POST — send notification email
export async function POST(request) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields (to, subject, body)." },
        { status: 400 }
      );
    }

    // ✅ Send via Resend
    const result = await resend.emails.send({
      from: "Pasig Sanitation <noreply@pasigsanitation-project.site>",
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
          <h2 style="color: #004AAD; margin-bottom: 10px;">${subject}</h2>
          <div>${body}</div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 13px; color: #777;">This is an automated message from <strong>Pasig Sanitation</strong>. Please do not reply to this email.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("❌ Resend API error:", result.error);
      return NextResponse.json(
        { error: "Resend API failed", details: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { msg: "✅ Email sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
