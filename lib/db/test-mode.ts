import {
  MOCK_OFFERINGS,
  MOCK_REGISTRATIONS,
  MOCK_SCHEDULE_DATA,
  MOCK_PERIOD,
  MOCK_STAFF,
  MOCK_STUDENTS,
  MOCK_INSTRUCTORS,
} from "@/lib/db/mock-data";

export const MOCK_ALL_REGISTRATIONS = [
  { id: 1, userId: 3, studentName: "김민수", studentEmail: "s01@test.kr", offeringId: 1, status: "CONFIRMED", enrolledAt: new Date(), courseName: "국어", category: "NORMAL_SEASON", waitlistSequence: null },
  { id: 2, userId: 4, studentName: "이지영", studentEmail: "s02@test.kr", offeringId: 2, status: "CONFIRMED", enrolledAt: new Date(), courseName: "영어", category: "NORMAL_SEASON", waitlistSequence: null },
  { id: 3, userId: 5, studentName: "박준호", studentEmail: "s03@test.kr", offeringId: 3, status: "WAITLISTED", enrolledAt: new Date(), courseName: "수학", category: "NORMAL_SEASON", waitlistSequence: 1 },
];

export function isTestMode(): boolean {
  return process.env.TEST_MODE === "true";
}

export const TEST = {
  getActivePeriod: () => MOCK_PERIOD,
  getAllOfferings: () => MOCK_OFFERINGS,
  getStudentOfferings: () => MOCK_OFFERINGS,
  getRegistrations: () => MOCK_REGISTRATIONS,
  getStaffRegistrations: () => MOCK_ALL_REGISTRATIONS,
  getStudents: () => MOCK_STUDENTS,
  getInstructors: () => MOCK_INSTRUCTORS,
  getOfferingsByIds: () => MOCK_SCHEDULE_DATA,
};
