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
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailPayload) {
  const resendKey = env.RESEND_API_KEY?.trim();

  // If Resend API Key is provided, use Resend's REST API for delivery
  if (resendKey) {
    try {
      console.log("Resend API Key found! Attempting delivery via Resend API...");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Form Builder <onboarding@resend.dev>",
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Email sent successfully via Resend API!", data);
        return data;
      } else {
        const errText = await response.text();
        console.error("Resend API returned an error, falling back to SMTP:", errText);
      }
    } catch (err) {
      console.error("Failed to send email via Resend API, falling back to SMTP:", err);
    }
  }

  const mailTransporter = await getMailTransporter();

  const info = await mailTransporter.sendMail({
    from: '"Form Builder Team" <no-reply@formbuilder.com>',
    to: Array.isArray(to) ? to.join(", ") : to,
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
        <p style="font-size: 11px; color: #737373; margin-top: 25px; border-top: 1px solid #e5e5e5; padding-top: 12px;">
          This link will expire in 5 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendForgotPasswordEmail(to: string, code: string) {
  const resetUrl = `http://localhost:8000/api/reset-password-verify?email=${encodeURIComponent(to)}&code=${code}`;

  return sendEmail({
    to,
    subject: "Reset Your Password - Form Builder",
    html: `
      <div style="font-family: sans-serif; padding: 25px; max-width: 550px; margin: auto; border: 2px solid #171717; background-color: #ffffff;">
        <h2 style="text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #171717; padding-bottom: 12px; color: #171717; font-size: 20px; font-weight: 800;">Reset Your Password</h2>
        <p style="color: #404040; font-size: 14px; line-height: 1.5;">We received a request to reset your password. Click the button below to set a new password:</p>
        
        <div style="margin: 25px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; background-color: #171717; color: #ffffff; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; border: 2px solid #171717;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 11px; color: #737373; margin-top: 25px; border-top: 1px solid #e5e5e5; padding-top: 12px;">
          This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `,
  });
}
