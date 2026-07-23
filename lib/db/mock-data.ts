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
  { id: 3, name: "김민수", email: "s01@test.kr", phone: "010-1111-2222", schoolGrade: "고3", createdAt: new Date() },
  { id: 4, name: "이지영", email: "s02@test.kr", phone: "010-1111-3333", schoolGrade: "고3", createdAt: new Date() },
  { id: 5, name: "박준호", email: "s03@test.kr", phone: "010-1111-4444", schoolGrade: "고3", createdAt: new Date() },
];

export const MOCK_INSTRUCTORS = [
  { id: 1, name: "김민철", subject: "국어", oneUpCapacity: 5, phone: null },
  { id: 2, name: "이수진", subject: "영어", oneUpCapacity: 5, phone: null },
  { id: 3, name: "박성호", subject: "수학", oneUpCapacity: 5, phone: null },
  { id: 4, name: "최은영", subject: "사탐", oneUpCapacity: 3, phone: null },
];
