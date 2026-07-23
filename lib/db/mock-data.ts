import type { SessionUser } from "@/lib/auth/session";

export const MOCK_USER: SessionUser = {
  id: 1,
  email: "12345",
  name: "테스트학생",
  role: "STUDENT",
};

export const MOCK_STAFF: SessionUser = {
  id: 2,
  email: "1234",
  name: "관리자",
  role: "ADMIN",
};

export const MOCK_OFFERINGS = [
  { id: 1, courseName: "국어", code: "KOR-01", category: "NORMAL_SEASON", teacher: "김민철", capacity: 20, status: "PUBLISHED", subject: "국어", confirmedCount: 5, waitlistCount: 0 },
  { id: 2, courseName: "영어", code: "ENG-01", category: "NORMAL_SEASON", teacher: "이수진", capacity: 20, status: "PUBLISHED", subject: "영어", confirmedCount: 12, waitlistCount: 0 },
  { id: 3, courseName: "수학", code: "MATH-01", category: "NORMAL_SEASON", teacher: "박성호", capacity: 25, status: "PUBLISHED", subject: "수학", confirmedCount: 20, waitlistCount: 2 },
  { id: 4, courseName: "사회문화", code: "SOC-01", category: "NORMAL_SEASON", teacher: "최은영", capacity: 15, status: "PUBLISHED", subject: "사탐", confirmedCount: 15, waitlistCount: 0 },
  { id: 5, courseName: "물리학I", code: "SCI-01", category: "NORMAL_SEASON", teacher: "정태웅", capacity: 15, status: "PUBLISHED", subject: "과탐", confirmedCount: 3, waitlistCount: 0 },
  { id: 6, courseName: "국어 원업", code: "ONEUP-KOR", category: "ONE_UP", teacher: "김민철", capacity: 5, status: "PUBLISHED", subject: "국어", confirmedCount: 2, waitlistCount: 0 },
  { id: 7, courseName: "영어 원업", code: "ONEUP-ENG", category: "ONE_UP", teacher: "이수진", capacity: 5, status: "PUBLISHED", subject: "영어", confirmedCount: 3, waitlistCount: 0 },
  { id: 8, courseName: "여름방학 특강", code: "SPC-ALL", category: "SPECIAL", teacher: "김민철", capacity: 30, status: "PUBLISHED", subject: "종합", confirmedCount: 8, waitlistCount: 0 },
];

export const MOCK_REGISTRATIONS = [
  { id: 1, offeringId: 1, status: "CONFIRMED", courseName: "국어", category: "NORMAL_SEASON", teacher: "김민철", waitlistSequence: null, enrolledAt: "2026-07-01" },
  { id: 2, offeringId: 3, status: "CONFIRMED", courseName: "수학", category: "NORMAL_SEASON", teacher: "박성호", waitlistSequence: null, enrolledAt: "2026-07-01" },
];

export const MOCK_SCHEDULE_DATA = [
  { id: 1, courseName: "국어", teacher: "김민철", category: "NORMAL_SEASON", room: "201호", capacity: 20, status: "PUBLISHED", subject: "국어", sessionDate: "2026-07-06", startTime: "09:00:00", endTime: "09:50:00" },
  { id: 3, courseName: "수학", teacher: "박성호", category: "NORMAL_SEASON", room: "301호", capacity: 25, status: "PUBLISHED", subject: "수학", sessionDate: "2026-07-06", startTime: "11:00:00", endTime: "11:50:00" },
];

export const MOCK_PERIOD = {
  id: 1,
  name: "2026년 7월 정규학기",
  periodType: "SEMESTER",
  startDate: "2026-07-06",
  endDate: "2026-07-31",
  billingDays: 26,
  isActive: 1,
  createdAt: new Date(),
};

export const MOCK_STUDENTS = [
  { id: 3, name: "김민수", email: "s01@test.kr", phone: "010-1111-0001", schoolGrade: "고3", classCode: "MK", createdAt: new Date() },
  { id: 4, name: "이지영", email: "s02@test.kr", phone: "010-1111-0002", schoolGrade: "고3", classCode: "MJ", createdAt: new Date() },
  { id: 5, name: "박준호", email: "s03@test.kr", phone: "010-1111-0003", schoolGrade: "고3", classCode: "MW", createdAt: new Date() },
  { id: 6, name: "최서연", email: "s04@test.kr", phone: "010-1111-0004", schoolGrade: "고3", classCode: "ES", createdAt: new Date() },
  { id: 7, name: "정도윤", email: "s05@test.kr", phone: "010-1111-0005", schoolGrade: "고3", classCode: "EK", createdAt: new Date() },
  { id: 8, name: "강하은", email: "s06@test.kr", phone: "010-1111-0006", schoolGrade: "고2", classCode: "HM", createdAt: new Date() },
  { id: 9, name: "윤지후", email: "s07@test.kr", phone: "010-1111-0007", schoolGrade: "고2", classCode: "HW", createdAt: new Date() },
  { id: 10, name: "장예린", email: "s08@test.kr", phone: "010-1111-0008", schoolGrade: "고2", classCode: "DM", createdAt: new Date() },
  { id: 11, name: "임현우", email: "s09@test.kr", phone: "010-1111-0009", schoolGrade: "고2", classCode: "DW", createdAt: new Date() },
  { id: 12, name: "한소희", email: "s10@test.kr", phone: "010-1111-0010", schoolGrade: "고2", classCode: "KM", createdAt: new Date() },
  { id: 1, name: "테스트학생", email: "12345", phone: "010-9999-9999", schoolGrade: "고3", classCode: "KW", createdAt: new Date() },
];

export const MOCK_INSTRUCTORS = [
  { id: 1, name: "김민철", subject: "국어", oneUpCapacity: 5, phone: null },
  { id: 2, name: "이수진", subject: "영어", oneUpCapacity: 5, phone: null },
  { id: 3, name: "박성호", subject: "수학", oneUpCapacity: 5, phone: null },
  { id: 4, name: "최은영", subject: "사탐", oneUpCapacity: 3, phone: null },
];
