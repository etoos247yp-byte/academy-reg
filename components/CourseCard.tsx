"use client";

import { useState } from "react";
import { enrollAction, cancelAction } from "@/lib/actions/enrollments";
import { Users, MapPin, Clock, User, X, Plus } from "lucide-react";

interface CourseCardProps {
  course: any;
  isEnrolled: boolean;
  enrolledCourseIds: Set<number>;
}

export function CourseCard({ course, enrolledCourseIds }: CourseCardProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEnrolled = enrolledCourseIds.has(course.id);
  const isFull = course.enrolled_count >= course.capacity;

  const handleAction = async () => {
    setLoading(true);
    setError("");
    const result = isEnrolled
      ? await cancelAction(course.id)
      : await enrollAction(course.id);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm transition ${isEnrolled ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500">{course.description}</p>
          )}
        </div>
        {isEnrolled && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            수강중
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        {course.instructor && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{course.instructor}</span>
          </div>
        )}
        {course.schedule && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{course.schedule}</span>
          </div>
        )}
        {course.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{course.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span className={isFull ? "font-medium text-red-500" : ""}>
            {course.enrolled_count} / {course.capacity}명
            {isFull ? " (마감)" : ""}
          </span>
        </div>
      </div>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      <button
        onClick={handleAction}
        disabled={loading || (!isEnrolled && isFull)}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
          isEnrolled
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : isFull
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isEnrolled ? (
          <>
            <X className="h-4 w-4" /> 수강 취소
          </>
        ) : isFull ? (
          "정원 마감"
        ) : (
          <>
            <Plus className="h-4 w-4" /> 수강 신청
          </>
        )}
      </button>
    </div>
  );
}
