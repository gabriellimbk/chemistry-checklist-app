const { getStudent, SupabaseApiError } = require("./_lib/supabase");
const { studentCookie } = require("./_lib/student-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method not allowed");
    return;
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const studentId = (url.searchParams.get("id") || "").trim();
    if (!studentId) {
      res.statusCode = 302;
      res.setHeader("Location", "/");
      res.end();
      return;
    }

    const student = await getStudent(studentId);
    if (!student) {
      res.statusCode = 302;
      res.setHeader("Location", "/?access=denied");
      res.end();
      return;
    }

    res.statusCode = 302;
    res.setHeader("Set-Cookie", studentCookie(student.student_id, req));
    res.setHeader("Location", "/");
    res.end();
  } catch (error) {
    const status = error instanceof SupabaseApiError ? error.status : 500;
    res.statusCode = status;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(error.message || "Unable to start student session");
  }
};
