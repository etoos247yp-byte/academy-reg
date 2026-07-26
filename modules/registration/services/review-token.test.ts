import { describe, it, expect } from "vitest";
import { createSeed, composeToken, parseToken } from "./review-token";
import { validateSelection } from "@/modules/registration/domain/registration";
import type { OfferingView } from "@/modules/registration/domain/types";

function offering(overrides: Partial<OfferingView> = {}): OfferingView {
  return {
    id: 1,
    courseName: "국어",
    category: "NORMAL_SEASON",
    teacher: "김민철",
    capacity: 20,
    confirmedCount: 5,
    waitlistCount: 0,
    sessions: [],
    priceAmount: 10000,
    priceModelType: "PER_SESSION",
    sessionCount: 4,
    packageTotal: 40000,
    isPublished: true,
    ...overrides,
  };
}

function reviewFor(seed: string, confirmedCount: number) {
  return validateSelection({
    offerings: new Map([[1, offering({ confirmedCount })]]),
    existingRegistrations: [],
    selection: [{ offeringId: 1 }],
    registrationWindowOpen: true,
    reviewToken: seed,
  });
}

describe("review token", () => {
  it("round-trips: parsing a composed token returns the seed and fingerprint", () => {
    const seed = createSeed(3, 1);
    const token = composeToken(seed, "abc123");
    expect(parseToken(token, 3, 1)).toEqual({ seed, fingerprint: "abc123" });
  });

  it("re-validating unchanged state with the parsed seed reproduces the submitted fingerprint", () => {
    // The prepare→confirm handshake: prepare issues sha256(seed|state) and hands
    // the client `${seed}.${fingerprint}`; confirm must be able to recompute the
    // exact same fingerprint from the token alone when state has not changed.
    const seed = createSeed(3, 1);
    const prepared = reviewFor(seed, 5);
    const token = composeToken(seed, prepared.reviewToken);

    const parsed = parseToken(token, 3, 1);
    expect(parsed).not.toBeNull();
    const reconfirmed = reviewFor(parsed!.seed, 5);
    expect(reconfirmed.reviewToken).toBe(parsed!.fingerprint);
  });

  it("detects changed state: a different confirmed count yields a different fingerprint", () => {
    const seed = createSeed(3, 1);
    const prepared = reviewFor(seed, 19); // 1 seat left → CONFIRMED
    const token = composeToken(seed, prepared.reviewToken);

    const parsed = parseToken(token, 3, 1)!;
    const reconfirmed = reviewFor(parsed.seed, 20); // now full → WAITLISTED
    expect(reconfirmed.reviewToken).not.toBe(parsed.fingerprint);
  });

  it("rejects a token issued for another user", () => {
    const token = composeToken(createSeed(3, 1), "fp");
    expect(parseToken(token, 4, 1)).toBeNull();
  });

  it("rejects a token issued for another period", () => {
    const token = composeToken(createSeed(3, 1), "fp");
    expect(parseToken(token, 3, 2)).toBeNull();
  });

  it("rejects an expired token", () => {
    const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;
    const token = composeToken(createSeed(3, 1, twentyMinutesAgo), "fp");
    expect(parseToken(token, 3, 1)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(parseToken("garbage", 3, 1)).toBeNull();
    expect(parseToken("", 3, 1)).toBeNull();
    expect(parseToken("no-dot-here", 3, 1)).toBeNull();
  });

  it("stays within the 128-char review_token column limit", () => {
    const seed = createSeed(2147483647, 2147483647);
    const fingerprint = "a".repeat(64); // sha256 hex
    expect(composeToken(seed, fingerprint).length).toBeLessThanOrEqual(128);
  });
});
