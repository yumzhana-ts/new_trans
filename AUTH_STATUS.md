# Auth Status

This file summarizes the auth work already added on top of `main`.

## Done

### Email Verification

- `POST /api/auth/register`
  - creates the user
  - creates an email verification token
  - sends the verification email if SMTP is configured
- `GET /api/auth/verify-email`
  - verifies the token
  - marks the user as verified
- `POST /api/auth/resend-verification`
  - creates a fresh verification token for unverified users
- login blocks unverified non-admin users
- the seeded admin user is auto-verified

### Password Reset

- `POST /api/auth/forgot-password`
  - creates a password reset token
  - sends the reset email if SMTP is configured
- `POST /api/auth/reset-password`
  - validates the token
  - updates the password hash
  - invalidates active sessions
- `/reset-password`
  - page to request the reset link
  - page to submit the new password

### Roles

- `GET /api/auth/roles`
  - returns the assignable roles
- `PATCH /api/auth/users/:id/role`
  - updates the role of a user
  - admin only
  - self-demotion from admin is blocked
- admin user editing now uses the dedicated role endpoint instead of the generic user update route

### Two-Factor Authentication

- `POST /api/auth/2fa/setup`
  - creates a TOTP secret for the authenticated user
- `POST /api/auth/2fa/enable`
  - enables 2FA after validating the current authenticator code
- `POST /api/auth/2fa/verify`
  - finishes a login that is waiting for a TOTP code
- `POST /api/auth/2fa/disable`
  - disables 2FA after validating the current authenticator code
- `/profile`
  - includes a minimal 2FA setup, enable, and disable UI

### Social Login

- `GET /api/auth/social/[provider]/start`
  - starts the provider OAuth flow
- `GET /api/auth/social/[provider]/callback`
  - resolves or creates the local account
  - starts a normal session or pending 2FA login
- Google and GitHub are currently supported providers

## Current Auth Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/users`
- `PUT /api/auth/:id`
- `DELETE /api/auth/:id`
- `GET /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/roles`
- `PATCH /api/auth/users/:id/role`
- `POST /api/auth/2fa/setup`
- `POST /api/auth/2fa/enable`
- `POST /api/auth/2fa/verify`
- `POST /api/auth/2fa/disable`
- `GET /api/auth/social/[provider]/start`
- `GET /api/auth/social/[provider]/callback`
