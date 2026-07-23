"use client";

import { useState } from "react";
import { createCourseAction, updateCourseAction } from "@/lib/actions/courses";
import { X } from "lucide-react";

interface CourseFormProps {
  course?: any;
  onClose: () => void;
}

export function CourseForm({ course, onClose }: CourseFormProps) {
  const [error, setError] = useState("");
  const isEdit = !!course;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = isEdit
      ? await updateCourseAction(course.id, formData)
      : await createCourseAction(formData);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{isEdit ? "수업 수정" : "새 수업 등록"}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">수업명 *</label>
            <input name="title" defaultValue={course?.title || ""} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">설명</label>
            <textarea name="description" defaultValue={course?.description || ""} rows={2} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">강사</label>
              <input name="instructor" defaultValue={course?.instructor || ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">정원 *</label>
              <input name="capacity" type="number" defaultValue={course?.capacity || 20} min={1} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">일정</label>
            <input name="schedule" defaultValue={course?.schedule || ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="예: 월/수 10:00-11:30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">강의실</label>
            <input name="location" defaultValue={course?.location || ""} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>

          {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              취소
            </button>
            <button type="submit" className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              {isEdit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
