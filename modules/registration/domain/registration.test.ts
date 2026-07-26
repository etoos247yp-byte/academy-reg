import { describe, it, expect } from "vitest";
import { validateSelection } from "./registration";
import type { OfferingView, RegistrationItem, SelectionRequest } from "./types";
import { DomainError } from "./errors";

function makeOffering(overrides: Partial<OfferingView> = {}): OfferingView {
  return {
    id: 1,
    courseName: "수학",
    category: "NORMAL_SEASON",
    teacher: "박선생",
    capacity: 5,
    confirmedCount: 2,
    waitlistCount: 0,
    sessions: [{ date: new Date("2026-03-02"), startTime: "10:00", endTime: "11:30" }],
    priceAmount: 0,
    priceModelType: "PER_SESSION",
    sessionCount: 1,
    packageTotal: 0,
    isPublished: true,
    ...overrides,
  };
}

function makeConf(offering: OfferingView): RegistrationItem {
  return { offeringId: offering.id, status: "CONFIRMED", offering };
}

describe("validateSelection", () => {
  it("confirms a single available normal offering", () => {
    const offering = makeOffering();
    const result = validateSelection({
      offerings: new Map([[offering.id, offering]]),
      existingRegistrations: [],
      selection: [{ offeringId: offering.id }],
      registrationWindowOpen: true,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].outcome).toBe("CONFIRMED");
    expect(result.normalCount).toBe(0);
    expect(result.normalTierMonthlySurcharge).toBe(0);
  });

  it("counts existing confirmed normal registrations in tier", () => {
    const o1 = makeOffering({ id: 1, courseName: "국어", sessions: [
      { date: new Date("2026-03-02"), startTime: "09:00", endTime: "10:00" },
    ]});
    const o2 = makeOffering({ id: 2, courseName: "영어", sessions: [
      { date: new Date("2026-03-02"), startTime: "10:00", endTime: "11:00" },
    ]});
    const o3 = makeOffering({ id: 3, courseName: "수학", sessions: [
      { date: new Date("2026-03-02"), startTime: "11:00", endTime: "12:00" },
    ]});
    const o4 = makeOffering({ id: 4, courseName: "과학", sessions: [
      { date: new Date("2026-03-02"), startTime: "13:00", endTime: "14:00" },
    ]});

    const result = validateSelection({
      offerings: new Map([
        [o1.id, o1],
        [o2.id, o2],
        [o3.id, o3],
        [o4.id, o4],
      ]),
      existingRegistrations: [
        makeConf(o1),
        makeConf(o2),
        makeConf(o3),
      ],
      selection: [{ offeringId: o4.id }],
      registrationWindowOpen: true,
    });

    expect(result.items[0].outcome).toBe("CONFIRMED");
    expect(result.normalCount).toBe(3);
    expect(result.normalTierMonthlySurcharge).toBe(100_000);
  });

  it("shows 100,000 tier when crossing to 4 confirmed", () => {
    const existing = [
      makeConf(makeOffering({ id: 1, courseName: "과목1", sessions: [
        { date: new Date("2026-03-02"), startTime: "09:00", endTime: "10:00" },
      ]})),
      makeConf(makeOffering({ id: 2, courseName: "과목2", sessions: [
        { date: new Date("2026-03-02"), startTime: "10:00", endTime: "11:00" },
      ]})),
      makeConf(makeOffering({ id: 3, courseName: "과목3", sessions: [
        { date: new Date("2026-03-02"), startTime: "11:00", endTime: "12:00" },
      ]})),
    ];
    const newOffering = makeOffering({ id: 4, courseName: "과학", sessions: [
      { date: new Date("2026-03-02"), startTime: "13:00", endTime: "14:00" },
    ]});

    const result = validateSelection({
      offerings: new Map([[newOffering.id, newOffering]]),
      existingRegistrations: existing,
      selection: [{ offeringId: newOffering.id }],
      registrationWindowOpen: true,
    });

    expect(result.normalCount).toBe(3);
    expect(result.normalTierMonthlySurcharge).toBe(100_000);
    expect(result.items[0].outcome).toBe("CONFIRMED");
  });

  it("writes a plain-language disclosure for paid tiers: class name, monthly basis, season billed at once", () => {
    const existing = [1, 2, 3].map((id) =>
      makeConf(makeOffering({ id, courseName: `과목${id}`, sessions: [
        { date: new Date("2026-03-02"), startTime: `0${8 + id}:00`, endTime: `0${9 + id}:00` },
      ]})),
    );
    const newOffering = makeOffering({ id: 4, courseName: "과학", sessions: [
      { date: new Date("2026-03-02"), startTime: "13:00", endTime: "14:00" },
    ]});

    const result = validateSelection({
      offerings: new Map([[newOffering.id, newOffering]]),
      existingRegistrations: existing,
      selection: [{ offeringId: newOffering.id }],
      registrationWindowOpen: true,
    });

    expect(result.disclosureText).toContain("CLASS B");
    expect(result.disclosureText).toContain("월 100,000원");
    expect(result.disclosureText).toContain("일할 계산");
    expect(result.disclosureText).toContain("일괄 청구");
    expect(result.disclosureText).not.toContain("floor");
    expect(result.disclosureText).not.toContain("29.4");
  });

  it("writes a no-extra-cost disclosure naming CLASS A for the free tier", () => {
    const offering = makeOffering();
    const result = validateSelection({
      offerings: new Map([[offering.id, offering]]),
      existingRegistrations: [],
      selection: [{ offeringId: offering.id }],
      registrationWindowOpen: true,
    });

    expect(result.disclosureText).toContain("CLASS A");
    expect(result.disclosureText).toContain("추가 비용");
  });

  it("excludes non-normal categories from tier count", () => {
    const oneUp = makeOffering({ id: 10, category: "ONE_UP", courseName: "원업" });
    const special = makeOffering({ id: 11, category: "SPECIAL", courseName: "특강" });
    const normal = makeOffering({ id: 1, category: "NORMAL_SEASON", courseName: "수학" });

    const result = validateSelection({
      offerings: new Map([
        [oneUp.id, oneUp],
        [special.id, special],
        [normal.id, normal],
      ]),
      existingRegistrations: [],
      selection: [
        { offeringId: oneUp.id },
        { offeringId: special.id },
        { offeringId: normal.id },
      ],
      registrationWindowOpen: true,
    });

    expect(result.normalCount).toBe(0);
    expect(result.items).toHaveLength(3);
  });

  it("blocks registration when window is closed", () => {
    const offering = makeOffering();
    expect(() =>
      validateSelection({
        offerings: new Map([[offering.id, offering]]),
        existingRegistrations: [],
        selection: [{ offeringId: offering.id }],
        registrationWindowOpen: false,
      }),
    ).toThrow(DomainError);
  });

  it("waitlists when capacity is full", () => {
    const offering = makeOffering({ capacity: 3, confirmedCount: 3 });
    const result = validateSelection({
      offerings: new Map([[offering.id, offering]]),
      existingRegistrations: [],
      selection: [{ offeringId: offering.id }],
      registrationWindowOpen: true,
    });

    expect(result.items[0].outcome).toBe("WAITLISTED");
  });

  it("detects schedule conflict between selected and existing registrations", () => {
    const existing = makeOffering({ id: 1, courseName: "국어", sessions: [
      { date: new Date("2026-03-02"), startTime: "10:00", endTime: "12:00" },
    ]});
    const newOffering = makeOffering({ id: 2, courseName: "수학", sessions: [
      { date: new Date("2026-03-02"), startTime: "11:00", endTime: "13:00" },
    ]});

    const result = validateSelection({
      offerings: new Map([[newOffering.id, newOffering]]),
      existingRegistrations: [makeConf(existing)],
      selection: [{ offeringId: newOffering.id }],
      registrationWindowOpen: true,
    });

    expect(result.items[0].outcome).toBe("CONFLICT");
  });

  it("detects schedule conflict among selected items themselves", () => {
    const o1 = makeOffering({ id: 1, courseName: "국어", sessions: [
      { date: new Date("2026-03-02"), startTime: "10:00", endTime: "12:00" },
    ]});
    const o2 = makeOffering({ id: 2, courseName: "수학", sessions: [
      { date: new Date("2026-03-02"), startTime: "11:00", endTime: "13:00" },
    ]});

    const result = validateSelection({
      offerings: new Map([
        [o1.id, o1],
        [o2.id, o2],
      ]),
      existingRegistrations: [],
      selection: [{ offeringId: o1.id }, { offeringId: o2.id }],
      registrationWindowOpen: true,
    });

    const conflicted = result.items.filter((i) => i.outcome === "CONFLICT");
    expect(conflicted.length).toBeGreaterThan(0);
  });

  it("marks ONE_UP as SCHEDULE_PENDING", () => {
    const oneUp = makeOffering({ id: 10, category: "ONE_UP", courseName: "원업 영어" });

    const result = validateSelection({
      offerings: new Map([[oneUp.id, oneUp]]),
      existingRegistrations: [],
      selection: [{ offeringId: oneUp.id }],
      registrationWindowOpen: true,
    });

    expect(result.items[0].outcome).toBe("SCHEDULE_PENDING");
  });

  it("blocks duplicate registration", () => {
    const offering = makeOffering();
    expect(() =>
      validateSelection({
        offerings: new Map([[offering.id, offering]]),
        existingRegistrations: [makeConf(offering)],
        selection: [{ offeringId: offering.id }],
        registrationWindowOpen: true,
      }),
    ).toThrow(DomainError);
  });

  it("blocks unpublished offerings", () => {
    const offering = makeOffering({ isPublished: false });
    expect(() =>
      validateSelection({
        offerings: new Map([[offering.id, offering]]),
        existingRegistrations: [],
        selection: [{ offeringId: offering.id }],
        registrationWindowOpen: true,
      }),
    ).toThrow(DomainError);
  });
});
