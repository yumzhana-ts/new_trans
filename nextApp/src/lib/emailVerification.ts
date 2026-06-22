import { randomBytes } from "crypto";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_HOURS = 24;

function getAppUrl(): string {
  return process.env.APP_URL?.trim() || "https://localhost:8443";
}

function buildVerificationUrl(token: string): string {
  const appUrl = getAppUrl().replace(/\/$/, "");
  return `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

function getExpiryDate(): Date {
  return new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
}

function logVerificationLink(email: string, verifyUrl: string): void {
  console.log(`Verify email for ${email}: ${verifyUrl}`);
}

async function deliverVerificationEmail(email: string, verifyUrl: string): Promise<boolean> {
  const subject = "Verify your email";
  const text = `Verify your email by opening this link: ${verifyUrl}`;
  const html = `
    <p>Welcome to ft_transcendence.</p>
    <p>Please verify your email by clicking the link below:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
  `;

  if (!isMailConfigured()) {
    logVerificationLink(email, verifyUrl);
    return false;
  }

  try {
    await sendMail({
      to: email,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send verification email:", err);
    logVerificationLink(email, verifyUrl);
    return false;
  }
}

export async function createEmailVerificationToken(userId: number, email: string): Promise<{
  expiresAt: Date;
  mailed: boolean;
  token: string;
  verifyUrl: string;
}> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = getExpiryDate();

  await prisma.emailVerificationToken.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });

  const verifyUrl = buildVerificationUrl(token);
  const mailed = await deliverVerificationEmail(email, verifyUrl);

  return { token, expiresAt, verifyUrl, mailed };
}

export async function resendVerificationEmail(email: string): Promise<{
  message: string;
  verify_url?: string;
}> {
  const genericResponse = {
    message: "If the account exists, a verification email will be sent.",
  };

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return genericResponse;
  }

  const user = await prisma.users.findUnique({
    where: { email: trimmedEmail },
    select: {
      id: true,
      email: true,
      email_verified_at: true,
    },
  });

  if (!user || user.email_verified_at) {
    return genericResponse;
  }

  const verification = await createEmailVerificationToken(user.id, user.email);

  if (!verification.mailed) {
    return {
      ...genericResponse,
      verify_url: verification.verifyUrl,
    };
  }

  return genericResponse;
}

export async function verifyEmailToken(token: string): Promise<{ message: string }> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { users: true },
  });

  if (!verificationToken) {
    throw new Error("Invalid verification token");
  }

  if (verificationToken.consumed_at) {
    throw new Error("Verification token has already been used");
  }

  if (verificationToken.expires_at && verificationToken.expires_at <= new Date()) {
    throw new Error("Verification token has expired");
  }

  await prisma.$transaction([
    prisma.users.update({
      where: { id: verificationToken.user_id },
      data: { email_verified_at: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { consumed_at: new Date() },
    }),
  ]);

  return { message: "Email verified successfully" };
}
