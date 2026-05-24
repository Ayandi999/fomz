import nodemailer from "nodemailer";
import { env } from "../env";

let transporter: nodemailer.Transporter | null = null;

export async function getMailTransporter() {
  if (transporter) return transporter;

  let smtpUser = env.SMTP_USER?.trim();
  let smtpPass = env.SMTP_PASS?.trim();

  // Fallback to test ethereal account if no credentials provided in env
  if (!smtpUser || !smtpPass) {
    console.log("No SMTP credentials provided in .env. Creating a test Ethereal account dynamically...");
    const testAccount = await nodemailer.createTestAccount();
    smtpUser = testAccount.user;
    smtpPass = testAccount.pass;
  }

  // Create the transporter using Ethereal's SMTP settings
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
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
  const verifyUrl = `http://localhost:8000/api/verify-email?email=${encodeURIComponent(to)}&code=${code}`;

  return sendEmail({
    to,
    subject: "Verify Your Email - Form Builder",
    html: `
      <div style="font-family: sans-serif; padding: 25px; max-width: 550px; margin: auto; border: 2px solid #171717; background-color: #ffffff;">
        <h2 style="text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #171717; padding-bottom: 12px; color: #171717; font-size: 20px; font-weight: 800;">Verify Your Email</h2>
        <p style="color: #404040; font-size: 14px; line-height: 1.5;">Thank you for signing up! Click the button below to verify your email and activate your account instantly:</p>
        
        <div style="margin: 25px 0; text-align: center;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background-color: #171717; color: #ffffff; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; border: 2px solid #171717;">
            Verify Account Instantly
          </a>
        </div>

        <p style="color: #404040; font-size: 14px; margin-top: 20px;">Or, copy and paste this link in your browser:</p>
        <p style="word-break: break-all; font-size: 12px; color: #0284c7; background-color: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; margin: 10px 0;">
          ${verifyUrl}
        </p>

        <div style="margin: 25px 0; padding: 15px; border: 1px dashed #171717; background-color: #f5f5f5; text-align: center;">
          <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #737373; letter-spacing: 0.5px;">Manual Verification Code:</span>
          <div style="font-size: 26px; font-weight: 800; letter-spacing: 5px; color: #171717; margin-top: 5px;">${code}</div>
        </div>
        
        <p style="font-size: 11px; color: #737373; margin-top: 25px; border-top: 1px solid #e5e5e5; padding-top: 12px;">
          This link and code will expire in 5 minutes. If you did not request this, please ignore this email.
        </p>
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
