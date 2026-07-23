"use client";

import { useState } from "react";
import { deleteCourseAction } from "@/lib/actions/courses";
import { CourseForm } from "@/components/CourseForm";
import { Pencil, Trash2, Plus, Users, MapPin } from "lucide-react";

interface AdminCourseListProps {
  courses: any[];
}

export function AdminCourseList({ courses }: AdminCourseListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 수업을 삭제하시겠습니까?`)) return;
    await deleteCourseAction(id);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">수업 목록</h2>
        <button
          onClick={() => { setEditCourse(null); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          수업 추가
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">수업명</th>
              <th className="px-4 py-3 font-medium text-gray-700">강사</th>
              <th className="px-4 py-3 font-medium text-gray-700">일정</th>
              <th className="px-4 py-3 font-medium text-gray-700">강의실</th>
              <th className="px-4 py-3 font-medium text-gray-700">수강인원</th>
              <th className="px-4 py-3 font-medium text-gray-700">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {courses.map((course: any) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                <td className="px-4 py-3 text-gray-600">{course.instructor || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{course.schedule || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{course.location || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`${course.enrolled_count >= course.capacity ? "text-red-600 font-medium" : "text-gray-600"}`}>
                    {course.enrolled_count} / {course.capacity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditCourse(course); setShowForm(true); }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  등록된 수업이 없습니다. "수업 추가" 버튼을 눌러 등록하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CourseForm
          course={editCourse}
          onClose={() => { setShowForm(false); setEditCourse(null); }}
        />
      )}
    </div>
  );
}
