const { methodNotAllowed, sendError, sendJson } = require("./_lib/http");
const { getStudent, getUnlockRows, SupabaseApiError } = require("./_lib/supabase");
const { getStudentIdFromCookie, studentCookie } = require("./_lib/student-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const studentId = (url.searchParams.get("id") || getStudentIdFromCookie(req) || "").trim();
    if (!studentId) {
      return sendError(res, 400, "Student ID is required");
    }

    const student = await getStudent(studentId);
    if (!student) {
      return sendError(res, 403, "Student ID is not allowed");
    }

    const unlockRows = await getUnlockRows();
    const headers = url.searchParams.get("id") ? { "Set-Cookie": studentCookie(student.student_id, req) } : {};
    return sendJson(res, 200, { student, unlockRows }, headers);
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
