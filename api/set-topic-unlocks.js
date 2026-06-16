const { methodNotAllowed, readJson, sendError, sendJson } = require("./_lib/http");
const { validateTeacherSession } = require("./_lib/teacher-auth");
const { supabaseRequest, SupabaseApiError } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  try {
    const ok = await validateTeacherSession(req);
    if (!ok) {
      return sendError(res, 401, "Teacher session is not valid");
    }

    const body = await readJson(req);
    const scopeType = body.scope_type === "class" ? "class" : "global";
    const className = scopeType === "class" ? String(body.class_name || "").trim() : null;
    const unlocks = body.unlocks && typeof body.unlocks === "object" ? body.unlocks : null;
    if (scopeType === "class" && !className) {
      return sendError(res, 400, "class_name is required for class unlocks");
    }
    if (!unlocks) {
      return sendError(res, 400, "unlocks object is required");
    }

    const deleteFilter =
      scopeType === "global"
        ? "scope_type=eq.global&class_name=is.null"
        : `scope_type=eq.class&class_name=eq.${encodeURIComponent(className)}`;
    await supabaseRequest(`chemistry_checklist_app_topic_unlocks?${deleteFilter}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" }
    });

    const rows = Object.entries(unlocks).map(([topicId, isUnlocked]) => ({
      scope_type: scopeType,
      class_name: className,
      topic_id: topicId,
      is_unlocked: Boolean(isUnlocked),
      updated_at: new Date().toISOString()
    }));

    if (rows.length) {
      await supabaseRequest("chemistry_checklist_app_topic_unlocks", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: rows
      });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    return sendError(res, status, error.message, error.body);
  }
};
