import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Pasig City Sanitation" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify Your Pasig Sanitation Account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Account Verification</h2>
        <p>Thank you for registering! Please use the code below to verify your account:</p>
        <h3 style="background: #004AAD; color: white; display: inline-block; padding: 10px 20px; border-radius: 8px;">${verificationCode}</h3>
        <p>This code will expire in 15 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
