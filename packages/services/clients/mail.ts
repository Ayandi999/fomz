import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export async function getMailTransporter() {
  if (transporter) return transporter;

  // Create a test Ethereal account dynamically
  const testAccount = await nodemailer.createTestAccount();

  // Create the transporter using Ethereal's SMTP settings
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  return transporter;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailPayload) {
  const mailTransporter = await getMailTransporter();

  const info = await mailTransporter.sendMail({
    from: '"Form Builder Team" <no-reply@formbuilder.com>',
    to,
    subject,
    html,
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);
  // Preview URL is only available when sending through an Ethereal account
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

  return info;
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  return sendEmail({
    to,
    subject: "Verify Your Email - Form Builder",
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 2px solid #171717;">
        <h2 style="text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #171717; padding-bottom: 10px;">Verify Your Email</h2>
        <p>Thank you for signing up! Use the verification code below to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border: 1px dashed #171717; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #737373; margin-top: 20px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendForgotPasswordEmail(to: string, resetToken: string) {
  return sendEmail({
    to,
    subject: "Reset Your Password - Form Builder",
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 2px solid #171717;">
        <h2 style="text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #171717; padding-bottom: 10px;">Reset Your Password</h2>
        <p>We received a request to reset your password. Use the reset code below to proceed:</p>
        <div style="background-color: #f5f5f5; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border: 1px dashed #171717; margin: 20px 0;">
          ${resetToken}
        </div>
        <p style="font-size: 12px; color: #737373; margin-top: 20px;">This code will expire shortly. If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  });
}
