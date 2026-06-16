const { methodNotAllowed, sendError, sendJson } = require("./_lib/http");
const { validateTeacherSession } = require("./_lib/teacher-auth");
const { SupabaseApiError } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }

  try {
    const ok = await validateTeacherSession(req);
    if (!ok) {
      return sendError(res, 401, "Teacher session is not valid");
    }
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
