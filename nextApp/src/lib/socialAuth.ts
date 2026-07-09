import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { serialize } from "cookie";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PENDING_2FA_COOKIE,
  appendPendingTwoFactorCookie,
  appendSessionCookie,
  clearCookie,
  createPendingTwoFactorToken,
  createSessionToken,
  getPendingTwoFactorExpiry,
  getSessionExpiry,
  SESSION_COOKIE,
} from "@/lib/session";

export const SOCIAL_PROVIDER_GOOGLE = "google";
export const SOCIAL_PROVIDER_GITHUB = "github";
const SOCIAL_STATE_COOKIE_PREFIX = "oauth_state_";

type SupportedProvider = typeof SOCIAL_PROVIDER_GOOGLE | typeof SOCIAL_PROVIDER_GITHUB;

type GoogleTokenResponse = {
  access_token: string;
  error?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  name?: string;
};

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
};

type GitHubUserProfile = {
  id: number;
  email: string | null;
  login?: string;
  name?: string;
};

type GitHubEmail = {
  email: string;
  primary?: boolean;
  verified?: boolean;
};

type SocialProfile = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  fallbackName?: string;
};

function getAppUrl(): string {
  return process.env.APP_URL?.trim() || "https://localhost:8443";
}

function getSocialStateCookieName(provider: SupportedProvider): string {
  return `${SOCIAL_STATE_COOKIE_PREFIX}${provider}`;
}

function redirectUri(provider: SupportedProvider): string {
  return `${getAppUrl().replace(/\/$/, "")}/api/auth/social/${provider}/callback`;
}

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured");
  }

  return { clientId, clientSecret };
}

function getGitHubCredentials() {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured");
  }

  return { clientId, clientSecret };
}

export function isSupportedSocialProvider(provider: string): provider is SupportedProvider {
  return provider === SOCIAL_PROVIDER_GOOGLE || provider === SOCIAL_PROVIDER_GITHUB;
}

export function createSocialState(): string {
  return randomBytes(24).toString("hex");
}

export function appendSocialStateCookie(res: NextResponse, provider: SupportedProvider, state: string) {
  res.headers.append(
    "Set-Cookie",
    serialize(getSocialStateCookieName(provider), state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    })
  );
}

export function clearSocialStateCookie(res: NextResponse, provider: SupportedProvider) {
  res.headers.append(
    "Set-Cookie",
    serialize(getSocialStateCookieName(provider), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export function buildSocialStartUrl(provider: SupportedProvider, state: string): string {
  if (provider === SOCIAL_PROVIDER_GOOGLE) {
    const { clientId } = getGoogleCredentials();
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri(provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }

  if (provider === SOCIAL_PROVIDER_GITHUB) {
    const { clientId } = getGitHubCredentials();
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri(provider));
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    return url.toString();
  }

  throw new Error("Unsupported social provider");
}

async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri(SOCIAL_PROVIDER_GOOGLE),
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "Google token exchange failed");
  }

  return data as GoogleTokenResponse;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.sub || !data.email) {
    throw new Error("Failed to fetch Google profile");
  }

  return data as GoogleUserInfo;
}

async function exchangeGitHubCode(code: string): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri(SOCIAL_PROVIDER_GITHUB),
  });

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "GitHub token exchange failed");
  }

  return data as GitHubTokenResponse;
}

async function fetchGitHubProfile(accessToken: string): Promise<SocialProfile> {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "ft_transcendence",
  };

  const userRes = await fetch("https://api.github.com/user", { headers });
  const userData = (await userRes.json()) as GitHubUserProfile;

  if (!userRes.ok || !userData.id) {
    throw new Error("Failed to fetch GitHub profile");
  }

  let email = typeof userData.email === "string" ? userData.email.trim().toLowerCase() : "";
  let emailVerified = Boolean(email);

  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
    const emailsData = (await emailsRes.json()) as GitHubEmail[];

    if (!emailsRes.ok || !Array.isArray(emailsData)) {
      throw new Error("GitHub account email is not available");
    }

    const preferredEmail =
      emailsData.find((entry) => entry.primary && entry.verified && entry.email) ??
      emailsData.find((entry) => entry.verified && entry.email) ??
      emailsData.find((entry) => entry.email);

    if (!preferredEmail?.email) {
      throw new Error("GitHub account email is not available");
    }

    email = preferredEmail.email.trim().toLowerCase();
    emailVerified = Boolean(preferredEmail.verified);
  }

  return {
    providerUserId: String(userData.id),
    email,
    emailVerified,
    fallbackName: userData.login || userData.name || undefined,
  };
}

async function generateUniqueUsername(baseEmail: string, fallbackName?: string): Promise<string> {
  const preferred = (fallbackName || baseEmail.split("@")[0] || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);

  const base = preferred || "user";
  let candidate = base;
  let suffix = 1;

  while (await prisma.users.findFirst({ where: { username: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  return candidate;
}

type SocialUserResult = {
  role: string | null;
  userId: number;
  requiresTwoFactor: boolean;
};

async function resolveSocialUser(
  provider: SupportedProvider,
  profile: SocialProfile
): Promise<SocialUserResult> {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_provider_user_id: {
        provider,
        provider_user_id: profile.providerUserId,
      },
    },
    include: {
      users: {
        include: {
          two_factor_credential: true,
        },
      },
    },
  });

  if (existingAccount) {
    return {
      userId: existingAccount.user_id,
      role: existingAccount.users.role,
      requiresTwoFactor: Boolean(existingAccount.users.two_factor_credential?.enabled_at),
    };
  }

  const existingUser = await prisma.users.findUnique({
    where: { email: profile.email.toLowerCase() },
    include: { two_factor_credential: true },
  });

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: {
        user_id: existingUser.id,
        provider,
        provider_user_id: profile.providerUserId,
      },
    });

    if (profile.emailVerified && !existingUser.email_verified_at) {
      await prisma.users.update({
        where: { id: existingUser.id },
        data: { email_verified_at: new Date() },
      });
    }

    return {
      userId: existingUser.id,
      role: existingUser.role,
      requiresTwoFactor: Boolean(existingUser.two_factor_credential?.enabled_at),
    };
  }

  const username = await generateUniqueUsername(profile.email, profile.fallbackName);
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  const createdUser = await prisma.users.create({
    data: {
      email: profile.email.toLowerCase(),
      username,
      password_hash: passwordHash,
      role: "user",
      email_verified_at: profile.emailVerified ? new Date() : null,
      must_set_password: true,
      oauth_accounts: {
        create: {
          provider,
          provider_user_id: profile.providerUserId,
        },
      },
    },
    include: { two_factor_credential: true },
  });

  return {
    userId: createdUser.id,
    role: createdUser.role,
    requiresTwoFactor: false,
  };
}

function redirectTarget(role: string | null): string {
  return role === "admin" ? "/admin/users" : "/dashboard?view=profile";
}

async function finishSocialLogin(socialUser: SocialUserResult): Promise<{
  redirectTo: string;
  sessionToken: string;
  pendingTwoFactor?: boolean;
}> {
  if (socialUser.requiresTwoFactor) {
    const pendingToken = createPendingTwoFactorToken();
    const pendingExpiresAt = getPendingTwoFactorExpiry();

    await prisma.sessions.deleteMany({
      where: {
        user_id: socialUser.userId,
        token: { startsWith: "p2fa_" },
      },
    });

    await prisma.sessions.create({
      data: {
        user_id: socialUser.userId,
        token: pendingToken,
        expires_at: pendingExpiresAt,
      },
    });

    return {
      redirectTo: `${getAppUrl().replace(/\/$/, "")}/login?twoFactor=required`,
      sessionToken: pendingToken,
      pendingTwoFactor: true,
    };
  }

  const token = createSessionToken();
  const expiresAt = getSessionExpiry();

  await prisma.sessions.create({
    data: {
      user_id: socialUser.userId,
      token,
      expires_at: expiresAt,
    },
  });

  return {
    redirectTo: `${getAppUrl().replace(/\/$/, "")}${redirectTarget(socialUser.role)}`,
    sessionToken: token,
  };
}

export async function finishSocialCallback(
  provider: SupportedProvider,
  code: string
): Promise<{
  redirectTo: string;
  sessionToken: string;
  pendingTwoFactor?: boolean;
}> {
  if (provider === SOCIAL_PROVIDER_GOOGLE) {
    const tokenResponse = await exchangeGoogleCode(code);
    const googleProfile = await fetchGoogleUserInfo(tokenResponse.access_token);
    const socialUser = await resolveSocialUser(provider, {
      providerUserId: googleProfile.sub,
      email: googleProfile.email,
      emailVerified: Boolean(googleProfile.email_verified),
      fallbackName: googleProfile.given_name || googleProfile.name,
    });
    return finishSocialLogin(socialUser);
  }

  if (provider === SOCIAL_PROVIDER_GITHUB) {
    const tokenResponse = await exchangeGitHubCode(code);
    const gitHubProfile = await fetchGitHubProfile(tokenResponse.access_token || "");
    const socialUser = await resolveSocialUser(provider, gitHubProfile);
    return finishSocialLogin(socialUser);
  }

  throw new Error("Unsupported social provider");
}

export function applySocialLoginCookies(
  res: NextResponse,
  provider: SupportedProvider,
  sessionToken: string,
  pendingTwoFactor = false
) {
  clearSocialStateCookie(res, provider);

  if (pendingTwoFactor) {
    clearCookie(res, SESSION_COOKIE);
    appendPendingTwoFactorCookie(res, sessionToken);
    return;
  }

  clearCookie(res, PENDING_2FA_COOKIE);
  appendSessionCookie(res, sessionToken);
}
