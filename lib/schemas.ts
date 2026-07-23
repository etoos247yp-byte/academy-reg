import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export const registerSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력하세요"),
  phone: z.string().optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1, "수업명을 입력하세요"),
  description: z.string().optional(),
  instructor: z.string().optional(),
  schedule: z.string().optional(),
  capacity: z.coerce.number().int().min(1, "정원은 1명 이상이어야 합니다"),
  location: z.string().optional(),
});

export const enrollmentSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
