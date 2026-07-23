export const REGISTRATION_ERROR_CODES = [
  "REGISTRATION_WINDOW_CLOSED",
  "OFFERING_NOT_PUBLISHED",
  "OFFERING_NOT_FOUND",
  "CAPACITY_EXCEEDED",
  "SCHEDULE_CONFLICT",
  "DUPLICATE_REGISTRATION",
  "REVIEW_REQUIRED",
  "INVALID_REVIEW_TOKEN",
  "UNAUTHORIZED",
  "FORBIDDEN",
] as const;

export type RegistrationErrorCode = (typeof REGISTRATION_ERROR_CODES)[number];

export class DomainError extends Error {
  constructor(
    public readonly code: RegistrationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
