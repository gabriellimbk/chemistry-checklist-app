const { methodNotAllowed, readJson, sendError, sendJson } = require("./_lib/http");
const { getStudent, supabaseRequest, SupabaseApiError } = require("./_lib/supabase");
const { getStudentIdFromCookie } = require("./_lib/student-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  try {
    const body = await readJson(req);
    const studentId = String(body.student_id || getStudentIdFromCookie(req) || "").trim();
    const topicId = String(body.topic_id || "").trim();
    if (!studentId || !topicId) {
      return sendError(res, 400, "student_id and topic_id are required");
    }

    const student = await getStudent(studentId);
    if (!student) {
      return sendError(res, 403, "Student ID is not allowed");
    }

    await supabaseRequest("chemistry_checklist_app_topic_interactions?on_conflict=student_id,topic_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: { student_id: studentId, topic_id: topicId }
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
