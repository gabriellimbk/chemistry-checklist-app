const { methodNotAllowed, sendError, sendJson } = require("./_lib/http");
const { eq, getStudent, supabaseRequest, SupabaseApiError } = require("./_lib/supabase");
const { getStudentIdFromCookie } = require("./_lib/student-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const studentId = (url.searchParams.get("student_id") || getStudentIdFromCookie(req) || "").trim();
    const topicId = (url.searchParams.get("topic_id") || "").trim();
    if (!studentId || !topicId) {
      return sendError(res, 400, "student_id and topic_id are required");
    }

    const student = await getStudent(studentId);
    if (!student) {
      return sendError(res, 403, "Student ID is not allowed");
    }

    let masteryRows = [];
    try {
      masteryRows = await supabaseRequest(
        `chemistry_checklist_app_card_mastery?student_id=${eq(studentId)}&topic_id=${eq(topicId)}&select=card_id,is_mastered,highlight_state`
      );
    } catch (error) {
      if (!(error instanceof SupabaseApiError) || !String(error.body && error.body.code || "").includes("42703")) {
        throw error;
      }
      masteryRows = await supabaseRequest(
        `chemistry_checklist_app_card_mastery?student_id=${eq(studentId)}&topic_id=${eq(topicId)}&select=card_id,is_mastered`
      );
    }
    const interactionRows = await supabaseRequest(
      `chemistry_checklist_app_topic_interactions?student_id=${eq(studentId)}&topic_id=${eq(topicId)}&select=first_flipped_at&limit=1`
    );
    const highlights = {};
    (Array.isArray(masteryRows) ? masteryRows : []).forEach((row) => {
      if ((row.highlight_state === "yellow" || row.highlight_state === "green") && row.card_id) {
        highlights[row.card_id] = row.highlight_state;
      }
    });

    return sendJson(res, 200, {
      masteredCardIds: Array.isArray(masteryRows) ? masteryRows.filter((row) => row.is_mastered).map((row) => row.card_id) : [],
      highlights,
      interacted: Array.isArray(interactionRows) && interactionRows.length > 0
    });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
