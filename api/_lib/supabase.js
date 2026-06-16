const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

class SupabaseApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "SupabaseApiError";
    this.status = status;
    this.body = body;
  }
}

function ensureSupabaseConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseApiError("Supabase environment variables are not configured", 500);
  }
}

function restUrl(path) {
  ensureSupabaseConfig();
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

async function supabaseRequest(path, options = {}) {
  ensureSupabaseConfig();
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...options.headers
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(restUrl(path), {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      body = text;
    }
  }
  if (!response.ok) {
    throw new SupabaseApiError("Supabase request failed", response.status, body);
  }
  return body;
}

function eq(value) {
  return `eq.${encodeURIComponent(value)}`;
}

async function getStudent(studentId) {
  const rows = await supabaseRequest(
    `chemistry_checklist_app_students?student_id=${eq(studentId)}&select=student_id,class_name&limit=1`
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function getAllStudents() {
  const rows = await supabaseRequest("chemistry_checklist_app_students?select=student_id,class_name");
  return Array.isArray(rows) ? rows : [];
}

async function getUnlockRows() {
  const rows = await supabaseRequest(
    "chemistry_checklist_app_topic_unlocks?select=scope_type,class_name,topic_id,is_unlocked,updated_at"
  );
  return Array.isArray(rows) ? rows : [];
}

module.exports = {
  SupabaseApiError,
  eq,
  getAllStudents,
  getStudent,
  getUnlockRows,
  supabaseRequest
};
