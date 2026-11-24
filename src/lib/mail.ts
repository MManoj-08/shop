import "server-only";
import nodemailer from "nodemailer";

// Email is sent through any SMTP account, set in .env (for example a Gmail address with an
// "app password"). Until SMTP_HOST, SMTP_USER and SMTP_PASS are filled in, no email is sent.
export const mailConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendMail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!mailConfigured()) throw new Error("Email is not set up");
  const port = Number(process.env.SMTP_PORT) || 587;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM?.trim() || `Mangalore Stores <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}
