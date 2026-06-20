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
    const cardId = String(body.card_id || "").trim();
    const isMastered = Boolean(body.is_mastered);
    if (!studentId || !topicId || !cardId) {
      return sendError(res, 400, "student_id, topic_id and card_id are required");
    }

    const student = await getStudent(studentId);
    if (!student) {
      return sendError(res, 403, "Student ID is not allowed");
    }

    await supabaseRequest("chemistry_checklist_app_card_mastery?on_conflict=student_id,topic_id,card_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: {
        student_id: studentId,
        topic_id: topicId,
        card_id: cardId,
        is_mastered: isMastered,
        updated_at: new Date().toISOString()
      }
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
