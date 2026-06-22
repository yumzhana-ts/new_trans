import { createHmac, randomBytes } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const TOTP_ISSUER = "ft_transcendence";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid two-factor secret");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];

  return (binary % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

export function generateTwoFactorSecret(): string {
  return base32Encode(randomBytes(20));
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  const label = `${TOTP_ISSUER}:${email}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(TOTP_ISSUER)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const normalizedCode = code.replace(/\s+/g, "");

  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset++) {
    if (generateHotp(secret, currentCounter + offset) === normalizedCode) {
      return true;
    }
  }

  return false;
}
