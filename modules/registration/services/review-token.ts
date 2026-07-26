import crypto from "crypto";

// Review tokens are stateless: `${seed}.${fingerprint}` where the seed encodes
// the user, period, and issue time, and the fingerprint is the domain layer's
// sha256(seed | outcomes). Confirm re-runs validation with the same seed — a
// matching fingerprint proves the reviewed state is unchanged, with no
// server-side token storage (safe across serverless instances).

const TOKEN_TTL_MS = 10 * 60 * 1000;

export function createSeed(userId: number, periodId: number, issuedAtMs = Date.now()): string {
  const nonce = crypto.randomBytes(12).toString("hex");
  return `u${userId}-p${periodId}-t${issuedAtMs.toString(36)}-${nonce}`;
}

export function composeToken(seed: string, fingerprint: string): string {
  return `${seed}.${fingerprint}`;
}

export function parseToken(
  token: string,
  userId: number,
  periodId: number,
  nowMs = Date.now(),
): { seed: string; fingerprint: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const seed = token.slice(0, dot);
  const fingerprint = token.slice(dot + 1);

  const match = /^u(\d+)-p(\d+)-t([0-9a-z]+)-[0-9a-f]+$/.exec(seed);
  if (!match) return null;
  if (Number(match[1]) !== userId || Number(match[2]) !== periodId) return null;

  const issuedAtMs = parseInt(match[3], 36);
  if (!Number.isFinite(issuedAtMs) || nowMs - issuedAtMs > TOKEN_TTL_MS) return null;

  return { seed, fingerprint };
}
