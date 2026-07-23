import { db, schema } from "@/lib/db/connection";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  const studentHash = await bcrypt.hash("12345", 10);
  const staffHash = await bcrypt.hash("1234", 10);

  const users = await db.insert(schema.users).values([
    { email: "1234", passwordHash: staffHash, name: "관리자", role: "ADMIN", phone: "010-0000-0001" },
    { email: "staff@eetoos.kr", passwordHash: staffHash, name: "박선생", role: "STAFF", phone: "010-0000-0002" },
    { email: "12345", passwordHash: studentHash, name: "테스트학생", role: "STUDENT", phone: "010-9999-9999" },
    { email: "s01@test.kr", passwordHash: studentHash, name: "김민수", role: "STUDENT", phone: "010-1111-2222" },
    { email: "s02@test.kr", passwordHash: studentHash, name: "이지영", role: "STUDENT", phone: "010-1111-3333" },
    { email: "s03@test.kr", passwordHash: studentHash, name: "박준호", role: "STUDENT", phone: "010-1111-4444" },
    { email: "s04@test.kr", passwordHash: studentHash, name: "최서연", role: "STUDENT", phone: "010-1111-5555" },
    { email: "s05@test.kr", passwordHash: studentHash, name: "정도윤", role: "STUDENT", phone: "010-1111-6666" },
    { email: "s06@test.kr", passwordHash: studentHash, name: "강하은", role: "STUDENT", phone: "010-1111-7777" },
    { email: "s07@test.kr", passwordHash: studentHash, name: "윤지후", role: "STUDENT", phone: "010-1111-8888" },
    { email: "s08@test.kr", passwordHash: studentHash, name: "장예린", role: "STUDENT", phone: "010-1111-9999" },
    { email: "s09@test.kr", passwordHash: studentHash, name: "임현우", role: "STUDENT", phone: "010-1111-0000" },
    { email: "s10@test.kr", passwordHash: studentHash, name: "한소희", role: "STUDENT", phone: "010-1111-1111" },
  ]).returning({ id: schema.users.id });

  for (let i = 2; i < users.length; i++) {
    const classes = ["MK", "MJ", "MW", "ES", "EK", "HM", "HW", "DM", "DW", "KM", "KW"];
    await db.insert(schema.studentProfiles).values({
      userId: users[i].id,
      schoolGrade: i < 7 ? "고3" : "고2",
      classCode: classes[(i - 2) % classes.length],
    });
  }

  const instructors = await db.insert(schema.instructors).values([
    { name: "김민철", subject: "국어", oneUpCapacity: 5 },
    { name: "이수진", subject: "영어", oneUpCapacity: 5 },
    { name: "박성호", subject: "수학", oneUpCapacity: 5 },
    { name: "최은영", subject: "사탐", oneUpCapacity: 3 },
    { name: "정태웅", subject: "과탐", oneUpCapacity: 3 },
    { name: "송지원", subject: "국어", oneUpCapacity: 4 },
    { name: "한동수", subject: "수학", oneUpCapacity: 4 },
  ]).returning({ id: schema.instructors.id, oneUpCapacity: schema.instructors.oneUpCapacity });

  const courses = await db.insert(schema.courses).values([
    { code: "KOR-01", name: "국어", description: "수능 국어 영역 대비 (비문학)", subject: "국어" },
    { code: "KOR-02", name: "국어 심화", description: "1등급 목표 국어 심화 (문학)", subject: "국어" },
    { code: "ENG-01", name: "영어", description: "수능 영어 영역 대비 (독해)", subject: "영어" },
    { code: "ENG-02", name: "영어 심화", description: "1등급 목표 영어 심화 (듣기+독해)", subject: "영어" },
    { code: "MATH-01", name: "수학", description: "수능 수학 영역 대비 (공통)", subject: "수학" },
    { code: "MATH-02", name: "수학 심화", description: "1등급 목표 수학 심화 (미적분)", subject: "수학" },
    { code: "MATH-03", name: "확률과통계", description: "수능 선택과목 확률과 통계", subject: "수학" },
    { code: "SOC-01", name: "사회문화", description: "수능 사탐 사회문화 대비", subject: "사탐" },
    { code: "SOC-02", name: "생활과윤리", description: "수능 사탐 생활과 윤리 대비", subject: "사탐" },
    { code: "SCI-01", name: "물리학I", description: "수능 과탐 물리학I 대비", subject: "과탐" },
    { code: "SCI-02", name: "생명과학I", description: "수능 과탐 생명과학I 대비", subject: "과탐" },
    { code: "ONEUP-KOR", name: "국어 원업", description: "1:1 국어 개별지도 (25분)", subject: "국어" },
    { code: "ONEUP-ENG", name: "영어 원업", description: "1:1 영어 개별지도 (25분)", subject: "영어" },
    { code: "ONEUP-MATH", name: "수학 원업", description: "1:1 수학 개별지도 (25분)", subject: "수학" },
    { code: "SPC-ALL", name: "여름방학 특강", description: "국영수 집중 특강 4회", subject: "종합" },
  ]).returning({ id: schema.courses.id });

  const [period] = await db.insert(schema.academicPeriods).values({
    name: "2026년 7월 정규학기",
    periodType: "SEMESTER",
    startDate: "2026-07-06",
    endDate: "2026-07-31",
    billingDays: 26,
    isActive: 1,
  }).returning({ id: schema.academicPeriods.id });

  await db.insert(schema.registrationWindows).values({
    periodId: period.id,
    name: "2026년 7월 수강신청",
    opensAt: new Date("2026-01-01T09:00:00+09:00"),
    closesAt: new Date("2027-12-31T18:00:00+09:00"),
    addDropClosesAt: new Date("2027-12-31T18:00:00+09:00"),
  });

  const weekdaySlots = [
    { date: "2026-07-06", label: "월" },
    { date: "2026-07-07", label: "화" },
    { date: "2026-07-08", label: "수" },
    { date: "2026-07-09", label: "목" },
    { date: "2026-07-10", label: "금" },
  ];

  const normalDefs = [
    { ci: 0, si: 0, ts: "09:00:00", te: "09:50:00", r: "201호", cap: 20 },
    { ci: 1, si: 2, ts: "09:00:00", te: "09:50:00", r: "202호", cap: 20 },
    { ci: 2, si: 1, ts: "10:00:00", te: "10:50:00", r: "201호", cap: 20 },
    { ci: 3, si: 3, ts: "10:00:00", te: "10:50:00", r: "202호", cap: 20 },
    { ci: 4, si: 0, ts: "11:00:00", te: "11:50:00", r: "301호", cap: 25 },
    { ci: 5, si: 2, ts: "11:00:00", te: "11:50:00", r: "301호", cap: 25 },
    { ci: 6, si: 4, ts: "09:00:00", te: "09:50:00", r: "302호", cap: 20 },
    { ci: 7, si: 1, ts: "13:00:00", te: "13:50:00", r: "401호", cap: 15 },
    { ci: 8, si: 3, ts: "13:00:00", te: "13:50:00", r: "401호", cap: 15 },
    { ci: 9, si: 0, ts: "14:00:00", te: "14:50:00", r: "402호", cap: 15 },
    { ci: 10, si: 2, ts: "14:00:00", te: "14:50:00", r: "402호", cap: 15 },
  ];

  for (const def of normalDefs) {
    const [off] = await db.insert(schema.offerings).values({
      courseId: courses[def.ci].id,
      periodId: period.id,
      instructorId: instructors[def.ci % instructors.length].id,
      sectionCode: `N${def.ci + 1}`,
      category: "NORMAL_SEASON",
      capacity: def.cap,
      status: "PUBLISHED",
      room: def.r,
    }).returning({ id: schema.offerings.id });
    await db.insert(schema.offeringSessions).values({
      offeringId: off.id,
      sessionDate: weekdaySlots[def.si].date,
      startTime: def.ts,
      endTime: def.te,
    });
  }

  for (let i = 0; i < 3; i++) {
    await db.insert(schema.offerings).values({
      courseId: courses[11 + i].id,
      periodId: period.id,
      instructorId: instructors[i].id,
      sectionCode: `O${i + 1}`,
      category: "ONE_UP",
      capacity: instructors[i].oneUpCapacity,
      status: "PUBLISHED",
    });
  }

  const [specialOff] = await db.insert(schema.offerings).values({
    courseId: courses[14].id,
    category: "SPECIAL",
    capacity: 30,
    status: "PUBLISHED",
    instructorId: instructors[0].id,
    sectionCode: "SP1",
    room: "대강당",
  }).returning({ id: schema.offerings.id });
  for (const day of weekdaySlots) {
    await db.insert(schema.offeringSessions).values({
      offeringId: specialOff.id,
      sessionDate: day.date,
      startTime: "19:00:00",
      endTime: "21:50:00",
    });
  }

  const [normalTpl] = await db.insert(schema.pricingTemplates).values({
    category: "NORMAL_SEASON", priceModelType: "PER_SESSION", label: "일반 정규수업",
  }).returning({ id: schema.pricingTemplates.id });
  await db.insert(schema.pricingTemplateVersions).values({
    templateId: normalTpl.id, version: 1,
    config: { tiers: [
      { min: 0, max: 3, monthlySurcharge: 0 },
      { min: 4, max: 6, monthlySurcharge: 100000 },
      { min: 7, max: 9, monthlySurcharge: 200000 },
      { min: 10, max: 999, monthlySurcharge: 300000 },
    ], billingDivisor: 29.4 },
  });

  const [oneUpTpl] = await db.insert(schema.pricingTemplates).values({
    category: "ONE_UP", priceModelType: "PER_SESSION", label: "원업",
  }).returning({ id: schema.pricingTemplates.id });
  await db.insert(schema.pricingTemplateVersions).values({
    templateId: oneUpTpl.id, version: 1,
    config: { amountPerSession: 25000, sessionsPerMonth: 4 },
  });

  const [specialTpl] = await db.insert(schema.pricingTemplates).values({
    category: "SPECIAL", priceModelType: "FIXED_PACKAGE", label: "특강",
  }).returning({ id: schema.pricingTemplates.id });
  await db.insert(schema.pricingTemplateVersions).values({
    templateId: specialTpl.id, version: 1,
    config: { sessions: 4, packageTotal: 144000 },
  });

  const allOfferings = await db.select({ id: schema.offerings.id, category: schema.offerings.category }).from(schema.offerings);
  const normalVer = await db.select({ id: schema.pricingTemplateVersions.id }).from(schema.pricingTemplateVersions).where(eq(schema.pricingTemplateVersions.templateId, normalTpl.id)).limit(1).then(r => r[0]);
  const oneUpVer = await db.select({ id: schema.pricingTemplateVersions.id }).from(schema.pricingTemplateVersions).where(eq(schema.pricingTemplateVersions.templateId, oneUpTpl.id)).limit(1).then(r => r[0]);
  const specialVer = await db.select({ id: schema.pricingTemplateVersions.id }).from(schema.pricingTemplateVersions).where(eq(schema.pricingTemplateVersions.templateId, specialTpl.id)).limit(1).then(r => r[0]);

  for (const off of allOfferings) {
    if (off.category === "NORMAL_SEASON") {
      await db.insert(schema.offeringPricing).values({ offeringId: off.id, templateVersionId: normalVer.id, priceAmountPerSession: 0, sessionCount: 1, packageTotal: 0 });
    } else if (off.category === "ONE_UP") {
      await db.insert(schema.offeringPricing).values({ offeringId: off.id, templateVersionId: oneUpVer.id, priceAmountPerSession: 25000, sessionCount: 4, packageTotal: 100000 });
    } else if (off.category === "SPECIAL") {
      await db.insert(schema.offeringPricing).values({ offeringId: off.id, templateVersionId: specialVer.id, priceAmountPerSession: 36000, sessionCount: 4, packageTotal: 144000 });
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
