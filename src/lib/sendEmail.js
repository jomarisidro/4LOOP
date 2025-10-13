// lib/email.js (updated to use Resend)
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (to, verificationCode) => {
  try {
    await resend.emails.send({
      from: "Pasig City Sanitation <pasigsanitation-project.site>",
      to,
      subject: "Verify Your Pasig Sanitation Account",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Account Verification</h2>
          <p>Thank you for registering! Please use the code below to verify your account:</p>
          <h3 style="background: #004AAD; color: white; display: inline-block; padding: 10px 20px; border-radius: 8px;">
            ${verificationCode}
          </h3>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Failed to send verification email");
  }
};
