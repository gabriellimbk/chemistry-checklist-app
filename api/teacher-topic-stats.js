const { methodNotAllowed, sendError, sendJson } = require("./_lib/http");
const { validateTeacherSession } = require("./_lib/teacher-auth");
const { eq, getAllStudents, supabaseRequest, SupabaseApiError } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }

  try {
    const ok = await validateTeacherSession(req);
    if (!ok) {
      return sendError(res, 401, "Teacher session is not valid");
    }

    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const topicId = (url.searchParams.get("topic_id") || "").trim();
    const scope = url.searchParams.get("scope") === "class" ? "class" : "all";
    const className = (url.searchParams.get("class_name") || "").trim();
    if (!topicId) {
      return sendError(res, 400, "topic_id is required");
    }
    if (scope === "class" && !className) {
      return sendError(res, 400, "class_name is required for class scope");
    }

    const students = await getAllStudents();
    const allowedStudentIds = new Set(
      students
        .filter((student) => scope === "all" || student.class_name === className)
        .map((student) => student.student_id)
    );

    const interactionRows = await supabaseRequest(
      `chemistry_checklist_app_topic_interactions?topic_id=${eq(topicId)}&select=student_id`
    );
    const interactedStudentIds = new Set(
      (Array.isArray(interactionRows) ? interactionRows : [])
        .map((row) => row.student_id)
        .filter((studentId) => allowedStudentIds.has(studentId))
    );

    const masteryRows = await supabaseRequest(
      `chemistry_checklist_app_card_mastery?topic_id=${eq(topicId)}&is_mastered=eq.true&select=student_id,card_id`
    );
    const cards = {};
    (Array.isArray(masteryRows) ? masteryRows : []).forEach((row) => {
      if (!interactedStudentIds.has(row.student_id)) {
        return;
      }
      if (!cards[row.card_id]) {
        cards[row.card_id] = { mastered: 0, interacted: interactedStudentIds.size };
      }
      cards[row.card_id].mastered += 1;
    });

    return sendJson(res, 200, { interacted: interactedStudentIds.size, cards });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
