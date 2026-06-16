const { methodNotAllowed, readJson, sendError, sendJson } = require("./_lib/http");
const { createTeacherSession } = require("./_lib/teacher-auth");
const { SupabaseApiError } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  try {
    const body = await readJson(req);
    const password = String(body.password || "");
    if (!process.env.TEACHER_ADMIN_PASSWORD) {
      return sendError(res, 500, "Teacher password is not configured");
    }
    if (password !== process.env.TEACHER_ADMIN_PASSWORD) {
      return sendError(res, 401, "Invalid teacher password");
    }

    const session = await createTeacherSession(req);
    return sendJson(res, 200, { ok: true, expiresAt: session.expiresAt }, { "Set-Cookie": session.cookie });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
