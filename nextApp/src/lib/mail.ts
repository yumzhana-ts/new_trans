import nodemailer from "nodemailer";

type MailPayload = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

function getRequiredEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getSmtpPort(): number {
  const rawPort = process.env.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : 587;

  return Number.isInteger(port) && port > 0 ? port : 587;
}

export function isMailConfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransport() {
  const host = getRequiredEnv("SMTP_HOST");
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error("SMTP is not fully configured");
  }

  const port = getSmtpPort();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendMail(payload: MailPayload): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("\n📧 [DEV EMAIL]");
    console.log("To:", payload.to);
    console.log("Subject:", payload.subject);
    console.log("Content:");
    console.log(payload.html || payload.text);
    console.log("\n");
    return;
  }

  const transporter = createTransport();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
