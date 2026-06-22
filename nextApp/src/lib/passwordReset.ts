import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TTL_HOURS = 1;

function getAppUrl(): string {
  return process.env.APP_URL?.trim() || "https://localhost:8443";
}

function buildPasswordResetUrl(token: string): string {
  const appUrl = getAppUrl().replace(/\/$/, "");
  return `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function getExpiryDate(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60 * 1000);
}

function logResetLink(email: string, resetUrl: string): void {
  console.log(`Reset password for ${email}: ${resetUrl}`);
}

async function deliverPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const subject = "Reset your password";
  const text = `Reset your password by opening this link: ${resetUrl}`;
  const html = `
    <p>We received a password reset request for your ft_transcendence account.</p>
    <p>You can reset your password by clicking the link below:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this change, you can ignore this email.</p>
  `;

  if (!isMailConfigured()) {
    logResetLink(email, resetUrl);
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
    console.error("Failed to send password reset email:", err);
    logResetLink(email, resetUrl);
    return false;
  }
}

export async function createPasswordResetToken(userId: number, email: string): Promise<{
  expiresAt: Date;
  mailed: boolean;
  token: string;
  resetUrl: string;
}> {
  await prisma.passwordResetToken.updateMany({
    where: {
      user_id: userId,
      consumed_at: null,
    },
    data: {
      consumed_at: new Date(),
    },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = getExpiryDate();

  await prisma.passwordResetToken.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });

  const resetUrl = buildPasswordResetUrl(token);
  const mailed = await deliverPasswordResetEmail(email, resetUrl);

  return { token, expiresAt, resetUrl, mailed };
}

export async function requestPasswordReset(email: string): Promise<{
  message: string;
  reset_url?: string;
}> {
  const genericResponse = {
    message: "If the account exists, a password reset email will be sent.",
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
    },
  });

  if (!user) {
    return genericResponse;
  }

  const reset = await createPasswordResetToken(user.id, user.email);

  if (!reset.mailed) {
    return {
      ...genericResponse,
      reset_url: reset.resetUrl,
    };
  }

  return genericResponse;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!passwordResetToken) {
    throw new Error("Invalid reset token");
  }

  if (passwordResetToken.consumed_at) {
    throw new Error("Reset token has already been used");
  }

  if (passwordResetToken.expires_at && passwordResetToken.expires_at <= new Date()) {
    throw new Error("Reset token has expired");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.users.update({
      where: { id: passwordResetToken.user_id },
      data: { password_hash: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: passwordResetToken.id },
      data: { consumed_at: new Date() },
    }),
    prisma.sessions.deleteMany({
      where: { user_id: passwordResetToken.user_id },
    }),
  ]);

  return { message: "Password reset successfully" };
}
